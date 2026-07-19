let pipeline = null;
let env = null;

let extractor = null;

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

const loadPipelineWithRetries = async (modelName, device, dtype, maxRetries = 2) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pipeline("feature-extraction", modelName, {
        device,
        dtype,
        progress_callback: (data) => {
          self.postMessage({ type: 'progress', data });
        }
      });
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
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
      if (!pipeline) {
        const transformers = await new Function(
          "return import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2')"
        )();
        pipeline = transformers.pipeline;
        env = transformers.env;

        env.allowLocalModels = false;
        try {
          env.backends.onnx.wasm.numThreads = 1;
        } catch (e) {
          console.warn("Could not set numThreads", e);
        }
      }

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const gpuAvailable = !isMobile && await hasWebGpu();

      let backendUsed = "WASM";
      
      if (gpuAvailable) {
        try {
          extractor = await loadPipelineWithRetries(modelName, "webgpu", "q8", 2);
          backendUsed = "WebGPU";
        } catch (webGpuErr) {
          console.warn("WebGPU initialization failed. Falling back to WASM...", webGpuErr);
          extractor = await loadPipelineWithRetries(modelName, "wasm", "q8", 2);
          backendUsed = "WASM";
        }
      } else {
        extractor = await loadPipelineWithRetries(modelName, "wasm", "q8", 3);
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
      // outputs is a Tensor. We should return the data array
      const data = outputs.tolist(); // returns an array of arrays
      self.postMessage({ type: 'extract_result', id, embeddings: data });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: error.message || String(error) });
    }
  }
});
