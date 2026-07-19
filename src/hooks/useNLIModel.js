import { useState, useEffect, useMemo, useRef } from 'react';

export function useNLIModel(selectedModel = "Xenova/nli-deberta-v3-small") {
  const [model, setModel] = useState(null);
  const [modelStatus, setModelStatus] = useState("unloaded");
  const [backendUsed, setBackendUsed] = useState("");
  const [modelError, setModelError] = useState("");
  const [progressItems, setProgressItems] = useState({});

  const workerRef = useRef(null);
  const callbacksRef = useRef({});
  const messageIdRef = useRef(0);

  const progressPercent = useMemo(() => {
    const items = Object.values(progressItems);
    if (items.length === 0) return 0;
    return Math.round(
      items.reduce((acc, item) => acc + (item.progress || 0), 0) / items.length
    );
  }, [progressItems]);

  useEffect(() => {
    let isMounted = true;

    setModelStatus("loading");
    setProgressItems({});

    const worker = new Worker(new URL('../workers/nliWorker.js', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (!isMounted) return;
      const { type, data, backendUsed, error, id, outputs } = e.data;

      if (type === 'progress') {
        if (["progress", "download", "done"].includes(data.status)) {
          setProgressItems((prev) => ({ ...prev, [data.file]: data }));
        }
      } else if (type === 'ready') {
        setBackendUsed(backendUsed);
        setModelStatus("ready");
        setModelError("");
        
        const evaluateFunc = async (batchedInputs, options) => {
           return new Promise((resolve, reject) => {
              const msgId = messageIdRef.current++;
              callbacksRef.current[msgId] = { resolve, reject };
              workerRef.current.postMessage({
                 type: 'evaluate',
                 id: msgId,
                 payload: { batchedInputs, options }
              });
           });
        };
        
        setModel(() => evaluateFunc);
      } else if (type === 'error') {
        if (id !== undefined && callbacksRef.current[id]) {
           callbacksRef.current[id].reject(new Error(error));
           delete callbacksRef.current[id];
        } else {
           setModelStatus("error");
           setModelError(error);
        }
      } else if (type === 'evaluate_result') {
        if (id !== undefined && callbacksRef.current[id]) {
           callbacksRef.current[id].resolve(outputs);
           delete callbacksRef.current[id];
        }
      }
    };

    worker.postMessage({ type: 'load', payload: { modelName: selectedModel } });

    return () => {
      isMounted = false;
      worker.terminate();
    };
  }, [selectedModel]);

  return { model, modelStatus, backendUsed, modelError, progressPercent };
}
