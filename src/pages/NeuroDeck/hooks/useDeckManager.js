import { useCallback } from 'react';

export function useDeckManager({
  myDecks, setMyDecks,
  currentDeck, setCurrentDeck,
  loadedDeckId, setLoadedDeckId,
  streak, setStreak,
  showToast, t
}) {

  const saveDeckToCache = useCallback((name, forceEmpty = false) => {
    if (!forceEmpty && currentDeck.length === 0) {
      showToast("Cannot save an empty deck.");
      return;
    }
    const cleanDeck = currentDeck.map(q => {
       const { _sourceDeckId, ...rest } = q;
       return rest;
    });
    const newDeck = {
      id: Date.now().toString(),
      name: name || `Deck ${new Date().toLocaleDateString()}`,
      deck: cleanDeck,
      completed: false,
      parentId: null
    };
    setMyDecks(prev => [newDeck, ...prev]);
    showToast("Deck saved successfully!");
  }, [currentDeck, setMyDecks, showToast]);

  const overwriteDeckCache = useCallback(() => {
    if (!loadedDeckId) {
      showToast("No deck loaded to overwrite.");
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
    
    showToast("Deck updated successfully!");
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
      showToast(`Loaded deck: ${selected.name}`);
    }
  }, [myDecks, setCurrentDeck, setLoadedDeckId, showToast]);

  const deleteDeckFromCache = useCallback((id) => {
    if (window.confirm("Are you sure you want to delete this deck?")) {
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
       showToast("Deck(s) deleted.");
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
             showToast("Cannot move a folder into its own subfolder.");
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
    showToast("Cards updated!");
  }, [setCurrentDeck, showToast]);

  const handleDeleteCards = useCallback((idsToDelete) => {
    if (idsToDelete.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${idsToDelete.length} card(s)?`)) {
       setCurrentDeck(prev => prev.filter(card => !idsToDelete.includes(card.id)));
       showToast("Cards deleted!");
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
    const strippedDeck = currentDeck.map(q => {
      const { _sourceDeckId, ...rest } = q;
      return {
        ...rest,
        score: 0,
        attempts: 0,
        isMastered: false
      };
    });
    const blob = new Blob([JSON.stringify(strippedDeck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    let prefix = "neurodeck-clean-export";
    if (loadedDeckId) {
      const d = myDecks.find(deck => deck.id === loadedDeckId);
      if (d && d.name) prefix = `${d.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-clean-export`;
    }
    a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentDeck, loadedDeckId, myDecks]);

  const handleImport = useCallback((jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

  const handleBatchDeleteDecks = useCallback((ids) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} deck(s)?`)) {
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
       showToast("Decks deleted.");
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
    showToast("Decks moved.");
  }, [setMyDecks, showToast]);

  return {
    saveDeckToCache,
    overwriteDeckCache,
    loadDeckFromCache,
    deleteDeckFromCache,
    renameDeck,
    handleDirectDropSave,
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
