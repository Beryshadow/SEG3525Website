import { useCallback } from 'react';

export function useStudyEngine({
  currentDeck,
  setStreak,
  setCurrentIndex,
  t
}) {

  const computeActiveDeckPool = useCallback((deck) => {
    return deck.filter(c => !c.isMastered);
  }, []);

  const selectNextCard = useCallback((deck) => {
    const pool = computeActiveDeckPool(deck);
    if (pool.length === 0) return;
    const lowestAttempts = Math.min(...pool.map(c => c.attempts || 0));
    const candidates = pool.filter(c => (c.attempts || 0) === lowestAttempts);
    const nextId = candidates[Math.floor(Math.random() * candidates.length)].id;
    const globalIdx = deck.findIndex(c => c.id === nextId);
    if (globalIdx !== -1) setCurrentIndex(globalIdx);
  }, [computeActiveDeckPool, setCurrentIndex]);

  const updateCardStats = useCallback((id, newScore, firstTry, skipped) => {
    // Note: showToast was removed from here based on previous user request
    if (skipped) {
      setStreak(0);
    } else if (firstTry) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    return currentDeck.map(card => {
      if (card.id === id) {
        const attempts = (card.attempts || 0) + 1;
        const currentAvgScore = card.score || 0;
        const totalScore = (currentAvgScore * (attempts - 1)) + newScore;
        const updatedScore = Number((totalScore / attempts).toFixed(1));
        const isMastered = updatedScore >= 8 && attempts >= 2;
        return { ...card, score: updatedScore, attempts, isMastered };
      }
      return card;
    });
  }, [currentDeck, setStreak]);

  const handleManualNavigation = useCallback((dir) => {
    if (currentDeck.length === 0) return;
    const pool = computeActiveDeckPool(currentDeck);
    if (pool.length === 0) return;

    let currentPoolIndex = pool.findIndex(c => c.id === currentDeck[currentIndex]?.id);
    if (currentPoolIndex === -1) currentPoolIndex = 0;

    let nextPoolIndex = currentPoolIndex + dir;
    if (nextPoolIndex < 0) nextPoolIndex = pool.length - 1;
    if (nextPoolIndex >= pool.length) nextPoolIndex = 0;

    const targetId = pool[nextPoolIndex].id;
    const globalIdx = currentDeck.findIndex(c => c.id === targetId);
    if (globalIdx !== -1) {
      setCurrentIndex(globalIdx);
    }
  }, [currentDeck, currentIndex, computeActiveDeckPool, setCurrentIndex]);

  return {
    computeActiveDeckPool,
    selectNextCard,
    updateCardStats,
    handleManualNavigation
  };
}
