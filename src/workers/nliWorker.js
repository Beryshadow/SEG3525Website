import { pipeline, env } from '@huggingface/transformers';

let classifier = null;

const isMobile = typeof navigator !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2));
const hasSharedArrayBuffer = typeof self !== 'undefined' && typeof self.SharedArrayBuffer !== 'undefined';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

try {
  env.backends.onnx.wasm.proxy = false;
  // On mobile devices or browsers without SharedArrayBuffer (DuckDuckGo Mobile, Chrome Mobile, iOS WebViews),
  // force single-threaded WASM execution (numThreads = 1) to avoid SharedArrayBuffer memory allocation crashes.
  if (isMobile || !hasSharedArrayBuffer) {
    env.backends.onnx.wasm.numThreads = 1;
  } else {
    const threads = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? Math.max(1, navigator.hardwareConcurrency)
      : 1;
    env.backends.onnx.wasm.numThreads = threads;
  }
} catch (e) {
  console.warn("Could not set WASM env options", e);
}

async function hasWebGpu() {
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

const loadPipelineWithRetries = async (modelName, device, maxRetries = 2) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pipeline("text-classification", modelName, {
        device,
        progress_callback: (data) => {
          self.postMessage({ type: 'progress', data });
        }
      });
    } catch (e) {
      lastErr = e;
      console.warn(`NLI pipeline load attempt ${attempt} failed for ${modelName}:`, e);
      try { env.backends.onnx.wasm.numThreads = 1; } catch (err) {}
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  throw lastErr;
};

self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;

  if (type === 'load') {
    const { modelName } = payload;
    try {
      const gpuAvailable = !isMobile && await hasWebGpu();

      let backendUsed = "WASM";
      
      if (gpuAvailable) {
        try {
          classifier = await loadPipelineWithRetries(modelName, "webgpu", 2);
          backendUsed = "WebGPU";
        } catch (webGpuErr) {
          console.warn("WebGPU initialization failed. Falling back to WASM...", webGpuErr);
          try { env.backends.onnx.wasm.numThreads = 1; } catch (err) {}
          classifier = await loadPipelineWithRetries(modelName, "wasm", 2);
          backendUsed = "WASM";
        }
      } else {
        try { env.backends.onnx.wasm.numThreads = 1; } catch (err) {}
        classifier = await loadPipelineWithRetries(modelName, "wasm", 2);
        backendUsed = "WASM";
      }

      self.postMessage({ type: 'ready', backendUsed });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message || String(error) });
    }
  } else if (type === 'evaluate' || type === 'classify') {
    if (!classifier) {
      self.postMessage({ type: 'error', id, error: 'Model not loaded yet' });
      return;
    }
    
    try {
      const { batchedInputs, text, textPair, options } = payload;
      let output;
      let maxLen = 128;
      if (batchedInputs && Array.isArray(batchedInputs) && batchedInputs.length > 0) {
        const maxChars = Math.max(...batchedInputs.map(str => (typeof str === 'string' ? str.length : 0)));
        const approxTokens = Math.ceil(maxChars / 3);
        if (approxTokens > 128) {
          maxLen = Math.min(512, Math.ceil(approxTokens / 64) * 64);
        }
      } else if (text) {
        const totalLen = (typeof text === 'string' ? text.length : 0) + (typeof textPair === 'string' ? textPair.length : 0);
        const approxTokens = Math.ceil(totalLen / 3);
        if (approxTokens > 128) {
          maxLen = Math.min(512, Math.ceil(approxTokens / 64) * 64);
        }
      }

      const opt = { top_k: 5, padding: true, truncation: true, max_length: maxLen, ...options };

      if (batchedInputs) {
        output = await classifier(batchedInputs, opt);
      } else if (textPair) {
        output = await classifier({ text, text_pair: textPair }, opt);
      } else {
        output = await classifier(text, opt);
      }

      const responseType = type === 'evaluate' ? 'evaluate_result' : 'classify_result';
      self.postMessage({ type: responseType, id, output });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: error.message || String(error) });
    }
  }
});
