import { pipeline, env } from '@huggingface/transformers';

let classifier = null;

const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
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
      ? Math.min(4, navigator.hardwareConcurrency)
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

const loadPipelineWithRetries = async (modelName, device, maxRetries = 3) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const options = {
        device,
        progress_callback: (data) => {
          self.postMessage({ type: 'progress', data });
        }
      };
      if (attempt === 1) {
        options.dtype = "q8";
      }
      return await pipeline("text-classification", modelName, options);
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
          classifier = await loadPipelineWithRetries(modelName, "wasm", 3);
          backendUsed = "WASM";
        }
      } else {
        classifier = await loadPipelineWithRetries(modelName, "wasm", 3);
        backendUsed = "WASM";
      }

      self.postMessage({ type: 'ready', backendUsed });
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message || String(error) });
    }
  } else if (type === 'classify') {
    if (!classifier) {
      self.postMessage({ type: 'error', id, error: 'Model not loaded yet' });
      return;
    }
    
    try {
      const { text, textPair, options } = payload;
      let output;
      if (textPair) {
        output = await classifier({ text, text_pair: textPair }, options || { top_k: 5 });
      } else {
        output = await classifier(text, options || { top_k: 5 });
      }
      self.postMessage({ type: 'classify_result', id, output });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: error.message || String(error) });
    }
  }
});
