import { useState, useEffect, useCallback, useRef } from 'react';

const SYNC_API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api/sync' : '/api/sync';

export function useNeuroSync({
  myDecks, setMyDecks,
  currentDeck, setCurrentDeck,
  loadedDeckId, setLoadedDeckId,
  streak, setStreak,
  selectedModel, setSelectedModel,
  cardOrderMode, setCardOrderMode,
  servingMode, setServingMode,
  selectedEmbeddingModel, setSelectedEmbeddingModel,
  focusMode, setFocusMode,
  questionTypeSettings, setQuestionTypeSettings,
  showToast, confirm, currentIndex, t
}) {
  const [syncCode, setSyncCode] = useState(() => {
    return localStorage.getItem('neurodeck-sync-code') || "";
  });
  const [syncVersion, setSyncVersion] = useState(() => {
    return parseInt(localStorage.getItem('neurodeck-sync-version')) || 0;
  });
  const [pairingCode, setPairingCode] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [datasetId] = useState(() => {
    let id = localStorage.getItem('neurodeck-dataset-id');
    if (!id) {
       if (window.crypto && window.crypto.getRandomValues) {
           const array = new Uint8Array(32);
           window.crypto.getRandomValues(array);
           id = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
       } else {
           id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
       }
       localStorage.setItem('neurodeck-dataset-id', id);
    }
    return id;
  });

  const isPullingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('neurodeck-sync-code', syncCode);
    localStorage.setItem('neurodeck-sync-version', syncVersion.toString());
  }, [syncCode, syncVersion]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    }
  }, []);

  const handleImportFromCode = async (code) => {
    if (!code) return;
    try {
      const res = await fetch(`${SYNC_API_BASE}/${code}/version`);
      if (!res.ok) {
        if (res.status === 404) showToast(t.shareCodeExpiredInvalid || "Share code expired or invalid.");
        else if (res.status === 429) showToast(t.rateLimitedTryAgain || "Rate limited, try again later.");
        else showToast(t.failedConnectSyncServer || "Failed to connect to sync server.");
        return;
      }
      if (res.ok) {
        const dataRes = await fetch(`${SYNC_API_BASE}/${code}`);
        const data = await dataRes.json();
        
        if (data && data.data) {
          if (data.data.myDecks !== undefined || data.data.currentDeck !== undefined) {
             showToast(t.detectedSyncCodeImporting || "Detected sync code in import input. Connecting...");
             handleConnectSyncCode(code);
             return;
          }

          // Check if already imported
          const alreadyImported = myDecks.find(d => d.originalShareCode === code);
          if (alreadyImported) {
              // If it's a hierarchy, find the root deck that we previously imported
              const rootToLoad = myDecks.find(d => d.originalShareCode === code && d.parentId === null) || alreadyImported;
              setCurrentDeck(rootToLoad.deck);
              setLoadedDeckId(rootToLoad.id);
              showToast(t.deckAlreadyImported || "Deck already imported. Loaded from library!");
              return;
          }

          if (data.data.sharedDecks) {
             const newDecks = data.data.sharedDecks;
             const idMap = {};
             const remappedDecks = newDecks.map(d => {
                const newId = Date.now().toString() + Math.random().toString();
                idMap[d.id] = newId;
                return { ...d, id: newId, originalId: d.id };
             });
             const finalizedDecks = remappedDecks.map(d => {
                const finalized = { ...d, parentId: d.parentId && idMap[d.parentId] ? idMap[d.parentId] : null, originalShareCode: code };
                delete finalized.originalId;
                return finalized;
             });
             setMyDecks(prev => [...finalizedDecks, ...prev]);
             
             const rootDeck = finalizedDecks.find(d => d.parentId === null) || finalizedDecks[0];
             if (rootDeck) {
                 setCurrentDeck(rootDeck.deck);
                 setLoadedDeckId(rootDeck.id);
             }
             
             showToast(t.hierarchyImportedSaved || "Hierarchy imported and saved to My Decks!");
          } else if (data.data.sharedDeck) {
             const newDeck = data.data.sharedDeck;
             const choice = await confirm({
               title: t.importDeckTitle || "Import Shared Deck",
               message: t.importDeckMessage || "Would you like to append these shared cards to your current deck, or save as a new deck in 'My Decks'?",
               buttons: [
                 { label: t.append || "Append", value: "append", primary: true },
                 { label: t.newDeck || "New Deck", value: "new" },
                 { label: t.cancel || "Cancel", value: null, secondary: true }
               ]
             });
             
             if (choice === "append") {
               setCurrentDeck(prev => [...prev, ...newDeck]);
               showToast(t.cardsAppended || "Cards appended to current deck!");
             } else if (choice === "new") {
               const newDeckObj = {
                 id: Date.now().toString(),
                 name: data.data.sharedName || `Imported Deck ${code}`,
                 deck: newDeck,
                 completed: false,
                 parentId: null,
                 originalShareCode: code
               };
               setMyDecks(prev => [newDeckObj, ...prev]);
               setCurrentDeck(newDeckObj.deck);
               setLoadedDeckId(newDeckObj.id);
               showToast(t.savedAsNewDeck || "Saved as new deck in My Decks!");
             }
          }
        } else {
          showToast(t.codeNotSharedDeck || "Code does not contain a shared deck.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message === "Failed to fetch" ? (t.networkFailedImport || "Network connection failed during import.") : (t.errorDuringImport || "An unexpected error occurred during import."));
    }
  };

  const handleCloudSyncDownload = useCallback(async (code, manual = false) => {
    if (!code) return;
    try {
      const res = await fetch(`${SYNC_API_BASE}/${code}`);
      if (res.status === 410) {
         showToast(t.cloudDataWipedRemotely || "Cloud data was remotely wiped. Sync disabled.");
         setSyncCode("");
         return;
      }
      if (res.status === 404) {
         if (code.length >= 64) {
             // Server reset or session expired. Reconcile by pushing local state.
             forcePushToCloud(code);
         } else {
             showToast(t.syncCodeExpiredNotFound || "Sync code expired or not found.");
             setSyncCode("");
         }
         return;
      }
      if (!res.ok) {
         let reason = "Server error";
         if (res.status === 413) reason = "Payload too large";
         else if (res.status === 403) reason = "Access denied";
         else if (res.status === 429) reason = "Rate limited";
         else if (res.status === 400) reason = "Invalid request";
         console.warn(`Failed to pull sync data: ${reason}`);
         if (manual) showToast(`${t.failedToPullSync || "Failed to pull sync data:"} ${reason}`);
         return;
      }
      const data = await res.json();
      if (data && data.data && data.data.pointer) {
         showToast(t.connectingSecureChannel || "Connecting to secure channel...");
         setSyncCode(data.data.pointer);
         setPairingCode(code); // Remember the pairing code we just used
         setTimeout(() => handleCloudSyncDownload(data.data.pointer, true), 100);
         return;
      }
      if (data && data.data && data.data.newSyncCode) {
         showToast(t.syncSessionMoved || "Sync session moved! Reconnecting...");
         setSyncCode(data.data.newSyncCode);
         setTimeout(() => handleCloudSyncDownload(data.data.newSyncCode, true), 100);
         return;
      }
      if (data && data.data && (data.data.sharedDeck || data.data.sharedDecks)) {
         showToast(t.detectedShareCodeImporting || "Detected share code in sync input. Importing...");
         handleImportFromCode(code);
         return;
      }
      if (data && data.version > syncVersion) {
         isPullingRef.current = true;
         if (data.data.myDecks) setMyDecks(data.data.myDecks);
         if (data.data.currentDeck) setCurrentDeck(data.data.currentDeck);
         if (data.data.loadedDeckId !== undefined) setLoadedDeckId(data.data.loadedDeckId);
         if (data.data.streak !== undefined) setStreak(data.data.streak);
         if (data.data.selectedModel) setSelectedModel(data.data.selectedModel);
         if (data.data.cardOrderMode) setCardOrderMode(data.data.cardOrderMode);
         if (data.data.servingMode) setServingMode(data.data.servingMode);
         if (data.data.selectedEmbeddingModel) setSelectedEmbeddingModel(data.data.selectedEmbeddingModel);
         if (data.data.focusMode) setFocusMode(data.data.focusMode);
         if (data.data.questionTypeSettings) setQuestionTypeSettings(data.data.questionTypeSettings);
         setSyncVersion(data.version);
         if (manual) {
            setSyncCode(code);
         }
         showToast(t.cloudSyncPulled || "Cloud sync: Data pulled successfully.");
      } else if (manual) {
         showToast(t?.syncUpToDate || "Connected! You are already up to date.");
      }
    } catch (err) {
       console.error("Auto-pull error", err);
       if (manual) showToast(err.message === "Failed to fetch" ? (t?.syncNetError || "Network connection failed.") : (t?.syncError || "An unexpected error occurred."));
    }
  }, [syncVersion, showToast, setMyDecks, setCurrentDeck, setLoadedDeckId, setStreak, setSelectedModel, setCardOrderMode, setServingMode, setSelectedEmbeddingModel, setFocusMode, setQuestionTypeSettings, t]);

  const handleConnectSyncCode = useCallback((codeToConnect) => {
      handleCloudSyncDownload(codeToConnect, true);
  }, [handleCloudSyncDownload]);

  const forcePushToCloud = useCallback(async (codeToUse) => {
      const code = codeToUse || syncCode;
      if (!code) return;
      const payload = { myDecks, currentDeck, loadedDeckId, streak, selectedModel, cardOrderMode, servingMode, selectedEmbeddingModel, focusMode, questionTypeSettings };
      const newVersion = Date.now();
      try {
         const res = await fetch(`${SYNC_API_BASE}/${code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload, version: newVersion, datasetId, type: 'sync' })
         });
         if (res.ok) {
            setSyncVersion(newVersion);
            showToast(t.cloudSyncPushed || "Cloud sync: Data pushed initially.");
         } else if (res.status === 410) {
            showToast(t.cloudDataWipedRemotely || "Cloud data was remotely wiped. Sync disabled.");
            setSyncCode("");
         } else {
            let reason = "Server error";
            if (res.status === 413) reason = "Data too large to sync";
            else if (res.status === 429) reason = "Rate limited";
            showToast(`${t.cloudSyncFailed || "Cloud sync failed:"} ${reason}`);
         }
      } catch (err) {
         console.error("Auto-push error", err);
         showToast(err.message === "Failed to fetch" ? (t.cloudSyncFailedNetwork || "Cloud sync failed: Network error") : (t.cloudSyncFailedUnexpected || "Cloud sync failed: Unexpected error"));
      }
  }, [syncCode, myDecks, currentDeck, loadedDeckId, streak, selectedModel, cardOrderMode, servingMode, selectedEmbeddingModel, focusMode, questionTypeSettings, showToast]);

  const handleGenerateSyncCode = useCallback(async () => {
     setIsGeneratingCode(true);
     
     let currentChannel = syncCode;
     if (!currentChannel || currentChannel.length < 64) {
         if (window.crypto && window.crypto.getRandomValues) {
             const array = new Uint8Array(32);
             window.crypto.getRandomValues(array);
             currentChannel = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
         } else {
             currentChannel = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
         }
         setSyncCode(currentChannel);
     }
     
     let newPairingCode = "";
     let attempts = 0;
     let success = false;
     
     while (attempts < 3 && !success) {
         attempts++;
         newPairingCode = Math.random().toString(36).substring(2, 7).toUpperCase();
         
         try {
             const res = await fetch(`${SYNC_API_BASE}/${newPairingCode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: { pointer: currentChannel }, version: Date.now(), datasetId, type: 'pairing' })
             });
             
             if (res.status === 409) {
                 // Collision, try again
                 continue;
             }
             
             if (res.status === 429) {
                 const errorData = await res.json();
                 showToast(errorData.error || t.highDemand || "Try again later, we are experiencing high demand.");
                 setIsGeneratingCode(false);
                 return;
             }
             
             if (res.ok) {
                 success = true;
             }
         } catch (e) {
             console.error("Failed to push pairing pointer", e);
             showToast(t.failedConnectSyncServer || "Failed to connect to sync server.");
             setIsGeneratingCode(false);
             return;
         }
     }
     
     if (!success) {
         showToast(t.failedGeneratePairingCode || "Failed to generate a unique pairing code. Try again.");
         setIsGeneratingCode(false);
         return;
     }
     
     setPairingCode(newPairingCode);
     forcePushToCloud(currentChannel);
     setIsGeneratingCode(false);
  }, [syncCode, forcePushToCloud, datasetId, showToast]);


  const handleClearCloudData = useCallback(async () => {
      const isConfirmed = await confirm({
        title: t.confirmClearCloudDataTitle || "Clear Cloud Data",
        message: t.confirmClearCloudDataMessage || "Are you sure you want to completely wipe all your cloud sync data? This will permanently delete all codes associated with your dataset.",
        buttons: [
          { label: t.wipeData || "Wipe Data", value: true, danger: true },
          { label: t.cancel || "Cancel", value: false, secondary: true }
        ]
      });
      
      if (!isConfirmed) return;
      
      try {
         const res = await fetch(`${SYNC_API_BASE}/clear/${datasetId}`, {
            method: 'DELETE'
         });
         if (res.ok) {
            const data = await res.json();
            showToast(`${t.cloudDataWiped || "Cloud data wiped successfully"} (${data.deletedCount} ${t.items || "items"}).`);
            setSyncCode("");
         } else {
            showToast(t.failedClearCloudData || "Failed to clear cloud data.");
         }
      } catch (err) {
         showToast(t.networkErrorClearingCloudData || "Network error while clearing cloud data.");
      }
  }, [datasetId, showToast]);

  const handleShareToCode = async (withProgress, shareHierarchy = false) => {
    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 chars for share
    
    let payload;
    if (shareHierarchy && loadedDeckId) {
       const getDescendants = (id) => {
          const children = myDecks.filter(d => d.parentId === id);
          let descendants = [...children];
          for (const child of children) {
             descendants = [...descendants, ...getDescendants(child.id)];
          }
          return descendants;
       };
       const rootDeck = myDecks.find(d => d.id === loadedDeckId);
       if (!rootDeck) {
          showToast(t.noLoadedDeckToShare || "No loaded deck found to share hierarchy.");
          return null;
       }
       const hierarchy = [rootDeck, ...getDescendants(loadedDeckId)];
       const decksToShare = hierarchy.map(d => ({
           ...d,
           deck: withProgress ? d.deck : (d.deck || []).map(q => ({ ...q, score: 0, attempts: 0, isMastered: false }))
       }));
       payload = { sharedDecks: decksToShare, sharedName: `Shared Hierarchy ${newCode}` };
    } else {
       const deckToShare = withProgress ? currentDeck : currentDeck.map(q => ({
         ...q,
         score: 0,
         attempts: 0,
         isMastered: false
       }));
       payload = { sharedDeck: deckToShare, sharedName: `Shared Deck ${newCode}` };
    }
    
    const newVersion = Date.now();
    try {
      const res = await fetch(`${SYNC_API_BASE}/${newCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload, version: newVersion, datasetId, type: 'share' })
      });
      if (res.ok) {
        showToast(`${t?.shareSuccess || "Shared successfully! Code:"} ${newCode}`);
        navigator.clipboard.writeText(newCode).catch(() => {});
        return newCode;
      } else {
         let reason = "Server error";
         if (res.status === 413) reason = "Deck is too large to share";
         else if (res.status === 429) reason = "Rate limited, try again later";
         else if (res.status === 400) reason = "Invalid request format";
         showToast(t?.syncError || "An unexpected error occurred.");
      }
    } catch (err) {
      console.error("Share error", err);
      showToast(err.message === "Failed to fetch" ? (t.networkFailedSharing || "Network connection failed while sharing.") : (t.errorWhileSharing || "An unexpected error occurred while sharing."));
    }
    return null;
  };

  useEffect(() => {
    let eventSource;
    if (syncCode) {
       eventSource = new EventSource(`${SYNC_API_BASE}/${syncCode}/subscribe`);
       
       eventSource.onmessage = (event) => {
           try {
               const data = JSON.parse(event.data);
               if (data.type === 'wiped') {
                   showToast(t.cloudDataWipedRemotely || "Cloud data was remotely wiped. Sync disabled.");
                   setSyncCode("");
                   return;
               }
               if (data.error === 'not_found') {
                   if (syncCode && syncCode.length >= 64) {
                       // Server reset or session expired. Reconcile by pushing local state.
                       forcePushToCloud(syncCode);
                   } else {
                       showToast(t.syncCodeExpiredNew || "Sync code expired. Please generate a new one.");
                       setSyncCode("");
                   }
               } else if (data.version && data.version > syncVersion) {
                   handleCloudSyncDownload(syncCode);
               }
           } catch (err) {
               console.error("SSE parse error", err);
           }
       };

       eventSource.onerror = (err) => {
           console.error("SSE connection error", err);
           // EventSource will automatically try to reconnect.
       };
    }
    return () => { 
        if (eventSource) {
            eventSource.close();
        }
    };
  }, [syncCode, syncVersion, handleCloudSyncDownload, showToast, forcePushToCloud]);

  useEffect(() => {
    const onFocus = () => {
       if (syncCode) {
          handleCloudSyncDownload(syncCode);
       }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [syncCode, handleCloudSyncDownload]);

  useEffect(() => {
    if (syncCode) {
       if (isPullingRef.current) {
          isPullingRef.current = false;
          return;
       }
       if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
       syncTimeoutRef.current = setTimeout(async () => {
          const payload = { myDecks, currentDeck, loadedDeckId, streak, selectedModel, cardOrderMode, servingMode, selectedEmbeddingModel, focusMode, questionTypeSettings };
          const newVersion = Date.now();
          try {
             const res = await fetch(`${SYNC_API_BASE}/${syncCode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload, version: newVersion, datasetId, type: 'sync' })
             });
             const resData = await res.json();
             if (resData.newSyncCode) {
                setSyncCode(resData.newSyncCode);
                showToast(t?.syncStreamConnected || "Cloud sync: Connected to stream.");
                return;
             }
             if (res.ok) {
                setSyncVersion(newVersion);
             } else if (res.status === 410) {
                showToast(t.cloudDataWipedRemotely || "Cloud data was remotely wiped. Sync disabled.");
                setSyncCode("");
             } else if (res.status === 413) {
                showToast(t.autoSyncFailedSize || "Auto-sync failed: Data too large");
             }
          } catch (err) {
             console.error("Auto-push error", err);
          }
       }, 2000);
    }
  }, [currentDeck, currentIndex, streak, myDecks, loadedDeckId, syncCode, selectedModel, cardOrderMode, servingMode, selectedEmbeddingModel, focusMode, questionTypeSettings, t]);

  return {
    syncCode,
    setSyncCode,
    pairingCode,
    setPairingCode,
    isGeneratingCode,
    syncVersion,
    datasetId,
    handleCloudSyncDownload,
    handleConnectSyncCode,
    forcePushToCloud,
    handleGenerateSyncCode,
    handleClearCloudData,
    handleShareToCode,
    handleImportFromCode
  };
}
