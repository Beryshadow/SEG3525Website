import { useState, useEffect, useMemo } from 'react';

export function useNLIModel(selectedModel = "Xenova/nli-deberta-v3-small") {
  const [model, setModel] = useState(null);
  const [modelStatus, setModelStatus] = useState("unloaded");
  const [backendUsed, setBackendUsed] = useState("");
  const [modelError, setModelError] = useState("");
  const [progressItems, setProgressItems] = useState({});

  const progressPercent = useMemo(() => {
    const items = Object.values(progressItems);
    if (items.length === 0) return 0;
    return Math.round(
      items.reduce((acc, item) => acc + (item.progress || 0), 0) / items.length
    );
  }, [progressItems]);

  useEffect(() => {
    let isMounted = true;

    const initModel = async () => {
      setModelStatus("loading");
      setProgressItems({});

      try {
        // eslint-disable-next-line no-new-func
        const transformers = await new Function(
          "return import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2')"
        )();
        const { pipeline, env } = transformers;

        env.allowLocalModels = false;
        try {
          env.backends.onnx.wasm.numThreads = 1;
        } catch (e) {
          console.warn("Could not set numThreads", e);
        }

        const progress_callback = (data) => {
          if (!isMounted) return;
          if (["progress", "download", "done"].includes(data.status)) {
            setProgressItems((prev) => ({ ...prev, [data.file]: data }));
          }
        };

        let hasWebGpu = false;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile && navigator.gpu) {
          try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) hasWebGpu = true;
          } catch (e) {
            console.warn("GPU adapter request failed:", e);
          }
        }

        const loadPipelineWithRetries = async (device, dtype, maxRetries = 2) => {
          let lastErr;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              return await pipeline("text-classification", selectedModel, {
                device,
                dtype,
                progress_callback,
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

        let classifier;
        if (hasWebGpu) {
          try {
            classifier = await loadPipelineWithRetries("webgpu", "q8", 2);
            if (isMounted) setBackendUsed("WebGPU");
          } catch (webGpuErr) {
            console.warn("WebGPU initialization failed. Falling back to WASM...", webGpuErr);
            classifier = await loadPipelineWithRetries("wasm", "q8", 2);
            if (isMounted) setBackendUsed("WASM");
          }
        } else {
          classifier = await loadPipelineWithRetries("wasm", "q8", 3);
          if (isMounted) setBackendUsed("WASM");
        }

        if (isMounted && classifier) {
          setModel(() => classifier);
          setModelStatus("ready");
          setModelError("");
        }
      } catch (err) {
        console.error("Failed to load Transformers model:", err);
        if (isMounted) {
          setModelStatus("error");
          setModelError(err.message || String(err));
        }
      }
    };

    initModel();
    return () => { isMounted = false; };
  }, [selectedModel]);

  return { model, modelStatus, backendUsed, modelError, progressPercent };
}
