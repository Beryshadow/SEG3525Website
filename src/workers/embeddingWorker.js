import { pipeline, env } from '@huggingface/transformers';

let extractor = null;

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
      return await pipeline("feature-extraction", modelName, options);
    } catch (e) {
      lastErr = e;
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
      const gpuAvailable = !isMobile && await hasWebGpu();

      let backendUsed = "WASM";
      
      if (gpuAvailable) {
        try {
          extractor = await loadPipelineWithRetries(modelName, "webgpu", 2);
          backendUsed = "WebGPU";
        } catch (webGpuErr) {
          console.warn("WebGPU initialization failed. Falling back to WASM...", webGpuErr);
          extractor = await loadPipelineWithRetries(modelName, "wasm", 3);
          backendUsed = "WASM";
        }
      } else {
        extractor = await loadPipelineWithRetries(modelName, "wasm", 3);
        backendUsed = "WASM";
      }

      self.postMessage({ type: 'ready', backendUsed });
    } catch (error) {
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
