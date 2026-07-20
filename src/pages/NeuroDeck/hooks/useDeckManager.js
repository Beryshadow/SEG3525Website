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
    const newDeck = {
      id: Date.now().toString(),
      name: name || `Deck ${new Date().toLocaleDateString()}`,
      deck: currentDeck,
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
    setMyDecks(prev => prev.map(d => d.id === loadedDeckId ? { ...d, deck: currentDeck } : d));
    showToast("Deck updated successfully!");
  }, [loadedDeckId, currentDeck, setMyDecks, showToast]);

  const loadDeckFromCache = useCallback((id) => {
    const selected = myDecks.find(d => d.id === id);
    if (selected) {
      setCurrentDeck(selected.deck || []);
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
    a.download = `neurodeck-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [myDecks, currentDeck, loadedDeckId, streak]);

  const handleExportWithoutProgress = useCallback(() => {
    const strippedDeck = currentDeck.map(q => ({
      ...q,
      score: 0,
      attempts: 0,
      isMastered: false
    }));
    const blob = new Blob([JSON.stringify(strippedDeck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurodeck-clean-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentDeck]);

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

  return {
    saveDeckToCache,
    overwriteDeckCache,
    loadDeckFromCache,
    deleteDeckFromCache,
    renameDeck,
    handleDirectDropSave,
    handleMoveDeck,
    handleUpdateCards,
    handleDeleteCards,
    handleToggleDeckCompleted,
    handleExportProgress,
    handleExportWithoutProgress,
    handleImport,
    handleImportProgress
  };
}
