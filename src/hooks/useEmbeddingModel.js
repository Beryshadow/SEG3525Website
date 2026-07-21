import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export function useEmbeddingModel(selectedModel = "Xenova/all-MiniLM-L6-v2") {
  const [modelStatus, setModelStatus] = useState("unloaded");
  const [backendUsed, setBackendUsed] = useState("");
  const [modelError, setModelError] = useState("");
  const [progressItems, setProgressItems] = useState({});

  const workerRef = useRef(null);
  const callbacksRef = useRef({});
  const messageIdRef = useRef(0);
  const modelStatusRef = useRef("unloaded");

  const progressPercent = useMemo(() => {
    const items = Object.values(progressItems);
    if (items.length === 0) return 0;
    return Math.round(
      items.reduce((acc, item) => acc + (item.progress || 0), 0) / items.length
    );
  }, [progressItems]);

  const updateStatus = (status) => {
    modelStatusRef.current = status;
    setModelStatus(status);
  };

  const getEmbeddings = useCallback(async (texts) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || modelStatusRef.current !== 'ready') {
        return reject(new Error("Model not ready yet"));
      }

      const msgId = messageIdRef.current++;
      const timeoutId = setTimeout(() => {
        if (callbacksRef.current[msgId]) {
          callbacksRef.current[msgId].reject(new Error("Embedding worker timeout"));
          delete callbacksRef.current[msgId];
        }
      }, 15000);

      callbacksRef.current[msgId] = {
        resolve: (val) => { clearTimeout(timeoutId); resolve(val); },
        reject: (err) => { clearTimeout(timeoutId); reject(err); }
      };

      workerRef.current.postMessage({
        type: 'extract',
        id: msgId,
        payload: { texts }
      });
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    updateStatus("loading");
    setProgressItems({});

    const worker = new Worker(new URL('../workers/embeddingWorker.js', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (!isMounted) return;
      const { type, data, backendUsed, error, id, embeddings } = e.data;

      if (type === 'progress') {
        if (["progress", "download", "done"].includes(data.status)) {
          setProgressItems((prev) => ({ ...prev, [data.file]: data }));
        }
      } else if (type === 'ready') {
        setBackendUsed(backendUsed);
        updateStatus("ready");
        setModelError("");
      } else if (type === 'error') {
        if (id !== undefined && callbacksRef.current[id]) {
           callbacksRef.current[id].reject(new Error(error));
           delete callbacksRef.current[id];
        } else {
           updateStatus("error");
           setModelError(error);
        }
      } else if (type === 'extract_result') {
        if (id !== undefined && callbacksRef.current[id]) {
           callbacksRef.current[id].resolve(embeddings);
           delete callbacksRef.current[id];
        }
      }
    };

    worker.postMessage({ type: 'load', payload: { modelName: selectedModel } });

    return () => {
      isMounted = false;
      updateStatus("unloaded");
      worker.terminate();
    };
  }, [selectedModel]);

  return { getEmbeddings, modelStatus, backendUsed, modelError, progressPercent };
}
