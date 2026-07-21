import { useCallback } from 'react';

export function useDeckManager({
  myDecks, setMyDecks,
  currentDeck, setCurrentDeck,
  loadedDeckId, setLoadedDeckId,
  streak, setStreak,
  showToast, confirm, t
}) {

  const saveDeckToCache = useCallback((name, forceEmpty = false) => {
    if (!forceEmpty && currentDeck.length === 0) {
      showToast(t.cannotSaveEmptyDeck || "Cannot save an empty deck.");
      return;
    }
    const cleanDeck = currentDeck.map(q => {
       const { _sourceDeckId, ...rest } = q;
       return rest;
    });
    const newDeck = {
      id: Date.now().toString(),
      name: name || `Deck ${new Date().toLocaleDateString()}`,
      deck: forceEmpty ? [] : cleanDeck,
      completed: false,
      parentId: null
    };
    setMyDecks(prev => [newDeck, ...prev]);
    showToast(t.deckSavedSuccessfully || "Deck saved successfully!");
  }, [currentDeck, setMyDecks, showToast]);

  const overwriteDeckCache = useCallback(() => {
    if (!loadedDeckId) {
      showToast(t.noDeckLoadedToOverwrite || "No deck loaded to overwrite.");
      return;
    }
    
    setMyDecks(prev => {
       const getDescendantDecks = (deckId) => {
          const children = prev.filter(d => d.parentId === deckId);
          let all = [...children];
          for (const child of children) {
             all = [...all, ...getDescendantDecks(child.id)];
          }
          return all;
       };
       
       const hierarchyIds = new Set([loadedDeckId, ...getDescendantDecks(loadedDeckId).map(d => d.id)]);
       const groupedCards = {};
       for (const id of hierarchyIds) groupedCards[id] = [];
       
       for (const card of currentDeck) {
          const targetId = card._sourceDeckId && hierarchyIds.has(card._sourceDeckId) ? card._sourceDeckId : loadedDeckId;
          const { _sourceDeckId, ...cleanCard } = card;
          groupedCards[targetId].push(cleanCard);
       }
       
       return prev.map(d => {
          if (hierarchyIds.has(d.id)) {
             return { ...d, deck: groupedCards[d.id] };
          }
          return d;
       });
    });
    
    showToast(t.deckUpdatedSuccessfully || "Deck updated successfully!");
  }, [loadedDeckId, currentDeck, setMyDecks, showToast]);

  const loadDeckFromCache = useCallback((id) => {
    const selected = myDecks.find(d => d.id === id);
    if (selected) {
      const getDescendantDecks = (deckId) => {
         const children = myDecks.filter(d => d.parentId === deckId);
         let all = [...children];
         for (const child of children) {
            all = [...all, ...getDescendantDecks(child.id)];
         }
         return all;
      };
      
      const allDecks = [selected, ...getDescendantDecks(id)];
      let combinedDeck = [];
      for (const d of allDecks) {
         if (d.deck && Array.isArray(d.deck)) {
             const taggedCards = d.deck.map(card => ({ ...card, _sourceDeckId: d.id }));
             combinedDeck = [...combinedDeck, ...taggedCards];
         }
      }
      
      setCurrentDeck(combinedDeck);
      setLoadedDeckId(id);
      showToast(`${t.loadedDeckName || "Loaded deck:"} ${selected.name}`);
    }
  }, [myDecks, setCurrentDeck, setLoadedDeckId, showToast]);

  const deleteDeckFromCache = useCallback(async (id) => {
    const isConfirmed = await confirm({
      title: t.confirmDeleteDeckTitle || "Delete Deck",
      message: t.confirmDeleteDeckMessage || "Are you sure you want to delete this deck?",
      buttons: [
        { label: t.delete || "Delete", value: true, danger: true },
        { label: t.cancel || "Cancel", value: false, secondary: true }
      ]
    });
    
    if (isConfirmed) {
       const deleteIds = new Set();
       const collectDeletes = (deckId) => {
          deleteIds.add(deckId);
          myDecks.forEach(d => {
             if (d.parentId === deckId) collectDeletes(d.id);
          });
       };
       collectDeletes(id);
       
       setMyDecks(prev => prev.filter(d => !deleteIds.has(d.id)));
       if (deleteIds.has(loadedDeckId)) {
          setCurrentDeck([]);
          setLoadedDeckId(null);
       }
       showToast(t.decksDeleted || "Deck(s) deleted.");
    }
  }, [myDecks, loadedDeckId, setMyDecks, setCurrentDeck, setLoadedDeckId, showToast]);

  const renameDeck = useCallback((id, newName) => {
    setMyDecks(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
  }, [setMyDecks]);

  const handleDirectDropSave = useCallback((deckObj) => {
    setMyDecks(prev => [deckObj, ...prev]);
  }, [setMyDecks]);

  const handleMoveDeck = useCallback((draggedId, targetParentId) => {
    if (draggedId === targetParentId) return;
    setMyDecks(prev => {
       const draggedDeck = prev.find(d => d.id === draggedId);
       if (!draggedDeck) return prev;
       let curr = targetParentId;
       while (curr) {
          if (curr === draggedId) {
             showToast(t.cannotMoveFolderInsideSelf || "Cannot move a folder into its own subfolder.");
             return prev;
          }
          const parentDeck = prev.find(d => d.id === curr);
          curr = parentDeck ? parentDeck.parentId : null;
       }
       return prev.map(d => d.id === draggedId ? { ...d, parentId: targetParentId } : d);
    });
  }, [setMyDecks, showToast]);

  const handleUpdateCards = useCallback((updates) => {
    setCurrentDeck(prev => prev.map(card => {
       if (updates[card.id]) {
          return { ...card, ...updates[card.id] };
       }
       return card;
    }));
    showToast(t.cardsUpdated || "Cards updated!");
  }, [setCurrentDeck, showToast]);

  const handleDeleteCards = useCallback(async (idsToDelete) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    
    const isConfirmed = await confirm({
      title: t.confirmDeleteCardsTitle || "Delete Cards",
      message: t.confirmDeleteCardsMessage || `Are you sure you want to delete ${idsToDelete.length} card(s)?`,
      buttons: [
        { label: t.delete || "Delete", value: true, danger: true },
        { label: t.cancel || "Cancel", value: false, secondary: true }
      ]
    });
    
    if (isConfirmed) {
       setCurrentDeck(prev => prev.filter(card => !idsToDelete.includes(card.id)));
       showToast(t.cardsDeleted || "Cards deleted!");
    }
  }, [setCurrentDeck, showToast]);
  
  const handleToggleDeckCompleted = useCallback((id) => {
    setMyDecks(prev => prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d));
  }, [setMyDecks]);

  const handleExportProgress = useCallback(() => {
    const dataStr = JSON.stringify({ myDecks, currentDeck, loadedDeckId, streak }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    let prefix = "neurodeck-backup";
    if (loadedDeckId) {
      const d = myDecks.find(deck => deck.id === loadedDeckId);
      if (d && d.name) prefix = `${d.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-backup`;
    }
    a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [myDecks, currentDeck, loadedDeckId, streak]);

  const handleExportWithoutProgress = useCallback(() => {
    let exportData;
    let prefix = "neurodeck-clean-export";
    
    if (loadedDeckId) {
      const rootDeck = myDecks.find(d => d.id === loadedDeckId);
      if (rootDeck) {
         prefix = rootDeck.name ? `${rootDeck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-clean-export` : prefix;
         
         const getDescendants = (parentId) => {
            let children = myDecks.filter(d => d.parentId === parentId);
            let all = [...children];
            children.forEach(child => {
               all = all.concat(getDescendants(child.id));
            });
            return all;
         };
         
         exportData = [rootDeck, ...getDescendants(loadedDeckId)].map(d => {
            const strippedDeck = (d.deck || []).map(q => {
               const { _sourceDeckId, ...rest } = q;
               return { ...rest, score: 0, attempts: 0, isMastered: false };
            });
            return { ...d, deck: strippedDeck };
         });
      }
    }
    
    if (!exportData) {
       exportData = currentDeck.map(q => {
         const { _sourceDeckId, ...rest } = q;
         return {
           ...rest,
           score: 0,
           attempts: 0,
           isMastered: false
         };
       });
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentDeck, loadedDeckId, myDecks]);

  const handleBatchImportDecks = useCallback((decksData, targetParentId = null) => {
     const idMap = {};
     decksData.forEach(d => {
        idMap[d.id] = Date.now().toString() + Math.random().toString();
     });
     
     const newDecks = decksData.map(d => {
        const isRootDeck = !d.parentId || !idMap[d.parentId];
        return {
           ...d,
           id: idMap[d.id],
           parentId: isRootDeck ? targetParentId : idMap[d.parentId]
        };
     });
     
     setMyDecks(prev => [...newDecks, ...prev]);
     showToast(`${t.successfullyImported || "Successfully imported"} ${newDecks.length} ${t.items || "deck(s)"}`);
  }, [setMyDecks, showToast]);

  const handleImport = useCallback((jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed[0].deck !== undefined) {
          handleBatchImportDecks(parsed);
        } else {
          const formatted = parsed.map((q) => {
            const correctAnswersArray = q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
            return {
              ...q,
              correctAnswers: correctAnswersArray,
              id: q.id || Date.now().toString() + Math.random().toString(),
              score: 0,
              dueTurn: 0,
              attempts: 0,
              isMastered: false
            };
          });
          setCurrentDeck(formatted);
          setLoadedDeckId(null);
          showToast(t?.importSuccess || "Deck imported successfully!");
        }
      } else {
        showToast(t?.invalidJson || "Invalid JSON array.");
      }
    } catch (e) {
      showToast(t?.parseError || "Failed to parse JSON.");
    }
  }, [setCurrentDeck, setLoadedDeckId, showToast, t]);

  const handleImportProgress = useCallback((jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.myDecks) setMyDecks(parsed.myDecks);
      if (parsed.currentDeck) setCurrentDeck(parsed.currentDeck);
      if (parsed.loadedDeckId !== undefined) setLoadedDeckId(parsed.loadedDeckId);
      if (parsed.streak !== undefined) setStreak(parsed.streak);
      showToast(t?.backupRestored || "Backup restored successfully!");
    } catch (e) {
      showToast(t?.parseError || "Failed to parse backup.");
    }
  }, [setMyDecks, setCurrentDeck, setLoadedDeckId, setStreak, showToast, t]);

  const handleBatchDeleteDecks = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    
    const isConfirmed = await confirm({
      title: t.confirmDeleteDecksTitle || "Delete Decks",
      message: t.confirmDeleteDecksMessage || `Are you sure you want to delete ${ids.length} deck(s)?`,
      buttons: [
        { label: t.delete || "Delete", value: true, danger: true },
        { label: t.cancel || "Cancel", value: false, secondary: true }
      ]
    });
    
    if (isConfirmed) {
       const deleteIds = new Set();
       const collectDeletes = (deckId) => {
          deleteIds.add(deckId);
          myDecks.forEach(d => {
             if (d.parentId === deckId) collectDeletes(d.id);
          });
       };
       ids.forEach(id => collectDeletes(id));
       
       setMyDecks(prev => prev.filter(d => !deleteIds.has(d.id)));
       if (deleteIds.has(loadedDeckId)) {
          setCurrentDeck([]);
          setLoadedDeckId(null);
       }
       showToast(t.decksDeletedMsg || "Decks deleted.");
    }
  }, [myDecks, loadedDeckId, setMyDecks, setCurrentDeck, setLoadedDeckId, showToast]);

  const handleBatchMoveDecks = useCallback((draggedIds, targetParentId) => {
    setMyDecks(prev => {
       let updatedDecks = [...prev];
       for (const draggedId of draggedIds) {
           if (draggedId === targetParentId) continue;
           const draggedDeck = updatedDecks.find(d => d.id === draggedId);
           if (!draggedDeck) continue;
           
           let curr = targetParentId;
           let invalid = false;
           while (curr) {
              if (curr === draggedId) {
                 invalid = true;
                 break;
              }
              const parentDeck = updatedDecks.find(d => d.id === curr);
              curr = parentDeck ? parentDeck.parentId : null;
           }
           if (invalid) continue;
           
           updatedDecks = updatedDecks.map(d => d.id === draggedId ? { ...d, parentId: targetParentId } : d);
       }
       return updatedDecks;
    });
    showToast(t.decksMovedMsg || "Decks moved.");
  }, [setMyDecks, showToast]);

  return {
    saveDeckToCache,
    overwriteDeckCache,
    loadDeckFromCache,
    deleteDeckFromCache,
    renameDeck,
    handleDirectDropSave,
    handleBatchImportDecks,
    handleMoveDeck,
    handleBatchDeleteDecks,
    handleBatchMoveDecks,
    handleUpdateCards,
    handleDeleteCards,
    handleToggleDeckCompleted,
    handleExportProgress,
    handleExportWithoutProgress,
    handleImport,
    handleImportProgress
  };
}
