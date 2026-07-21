import { pipeline, env } from '@huggingface/transformers';

let extractor = null;

const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
const hasSharedArrayBuffer = typeof self !== 'undefined' && typeof self.SharedArrayBuffer !== 'undefined';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;

try {
  env.backends.onnx.wasm.proxy = false;
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

const sendLog = (msg) => {
  self.postMessage({ type: 'log', message: msg });
};

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
      sendLog(`Loading ${modelName} on ${device} (Attempt ${attempt})...`);
      return await pipeline("feature-extraction", modelName, {
        device,
        progress_callback: (data) => {
          self.postMessage({ type: 'progress', data });
        }
      });
    } catch (e) {
      lastErr = e;
      sendLog(`Attempt ${attempt} on ${device} failed: ${e.message || String(e)}`);
      console.warn(`Embedding pipeline load attempt ${attempt} failed for ${modelName}:`, e);
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
      sendLog(`Initializing AI environment (Mobile: ${isMobile}, Threads: ${env.backends.onnx.wasm.numThreads})...`);
      const gpuAvailable = !isMobile && await hasWebGpu();

      let backendUsed = "WASM";
      
      if (gpuAvailable) {
        try {
          extractor = await loadPipelineWithRetries(modelName, "webgpu", 2);
          backendUsed = "WebGPU";
        } catch (webGpuErr) {
          sendLog("WebGPU unavailable. Falling back to WebAssembly (WASM)...");
          extractor = await loadPipelineWithRetries(modelName, "wasm", 2);
          backendUsed = "WASM";
        }
      } else {
        extractor = await loadPipelineWithRetries(modelName, "wasm", 2);
        backendUsed = "WASM";
      }

      sendLog(`Model ready using ${backendUsed}.`);
      self.postMessage({ type: 'ready', backendUsed });
    } catch (error) {
      sendLog(`Error: ${error.message || String(error)}`);
      self.postMessage({ type: 'error', error: error.message || String(error) });
    }
  } else if (type === 'extract') {
    if (!extractor) {
      self.postMessage({ type: 'error', id, error: 'Model not loaded yet' });
      return;
    }
    
    try {
      const { texts } = payload;
      const outputs = await extractor(texts, { pooling: 'mean', normalize: true });
      let data;
      if (outputs && typeof outputs.tolist === 'function') {
        data = outputs.tolist();
      } else if (outputs && outputs.data && outputs.dims) {
        const [batchSize, dim] = outputs.dims;
        data = [];
        for (let i = 0; i < batchSize; i++) {
          data.push(Array.from(outputs.data.slice(i * dim, (i + 1) * dim)));
        }
      } else {
        data = Array.isArray(outputs) ? outputs : [];
      }
      self.postMessage({ type: 'extract_result', id, embeddings: data });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: error.message || String(error) });
    }
  }
});
