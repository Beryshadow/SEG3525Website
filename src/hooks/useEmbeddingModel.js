import { useState, useEffect, useMemo, useRef } from 'react';

export function useEmbeddingModel(selectedModel = "Xenova/all-MiniLM-L6-v2") {
  const [extractFunc, setExtractFunc] = useState(null);
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
        setModelStatus("ready");
        setModelError("");
        
        const func = async (texts) => {
           return new Promise((resolve, reject) => {
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

              if (!workerRef.current) {
                 clearTimeout(timeoutId);
                 delete callbacksRef.current[msgId];
                 return reject(new Error("Worker not initialized"));
              }

              workerRef.current.postMessage({
                 type: 'extract',
                 id: msgId,
                 payload: { texts }
              });
           });
        };
        
        setExtractFunc(() => func);
      } else if (type === 'error') {
        if (id !== undefined && callbacksRef.current[id]) {
           callbacksRef.current[id].reject(new Error(error));
           delete callbacksRef.current[id];
        } else {
           setModelStatus("error");
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
      worker.terminate();
    };
  }, [selectedModel]);

  return { getEmbeddings: extractFunc, modelStatus, backendUsed, modelError, progressPercent };
}
