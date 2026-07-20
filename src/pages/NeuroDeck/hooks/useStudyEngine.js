import { useCallback } from 'react';
import { cosineSimilarity } from '../../../utilities/shared';

// --- PURE HELPER FUNCTIONS ---

export const applyFocusModeFilter = (deck, focusMode, cardEmbeddings) => {
  if (!focusMode || !focusMode.active || !focusMode.focalNodeId || !cardEmbeddings || !cardEmbeddings[focusMode.focalNodeId]) {
    return deck;
  }
  
  const focalEmbedding = cardEmbeddings[focusMode.focalNodeId];
  const mode = focusMode.mode || 'threshold';
  
  let similarities = deck.map(q => {
     if (q.id === focusMode.focalNodeId) return { id: q.id, sim: 2.0 };
     if (!cardEmbeddings[q.id]) return { id: q.id, sim: -2.0 };
     return { id: q.id, sim: cosineSimilarity(cardEmbeddings[q.id], focalEmbedding) };
  });

  let activeDeck = deck;
  if (mode === 'threshold') {
     const thresh = focusMode.threshold !== undefined ? focusMode.threshold : 0.85;
     const validIds = new Set(similarities.filter(s => s.sim >= thresh || s.id === focusMode.focalNodeId).map(s => s.id));
     activeDeck = deck.filter(q => validIds.has(q.id));
  } else if (mode === 'topN') {
     similarities.sort((a, b) => b.sim - a.sim);
     const topN = focusMode.topN || 5;
     const validIds = new Set(similarities.slice(0, topN).map(s => s.id));
     activeDeck = deck.filter(q => validIds.has(q.id));
  }
  
  return activeDeck.length > 0 ? activeDeck : deck;
};

export const applyQuestionTypeFilter = (deck, questionTypeSettings) => {
  if (!questionTypeSettings) return deck;
  
  const activeDeck = deck.filter(q => {
     const isLong = q.type === 'long' || (!q.choices || q.choices.length === 0);
     const isMulti = q.correctAnswers && q.correctAnswers.length > 1;
     const isMcc = !isLong && !isMulti;
     
     if (isLong && !questionTypeSettings.long) return false;
     if (isMulti && !questionTypeSettings.multi) return false;
     if (isMcc && !questionTypeSettings.mcc) return false;
     return true;
  });
  
  return activeDeck.length > 0 ? activeDeck : deck;
};

export const applyProportionalDeficit = (activeDeck, fullDeck, questionTypeSettings) => {
  if (!questionTypeSettings || !questionTypeSettings.proportional) return activeDeck;
  
  let targetLong = 0, targetMcc = 0, targetMulti = 0;
  let actualLong = 0, actualMcc = 0, actualMulti = 0;
  
  for (const q of fullDeck) {
     const isLong = q.type === 'long' || (!q.choices || q.choices.length === 0);
     const isMulti = q.correctAnswers && q.correctAnswers.length > 1;
     const isMcc = !isLong && !isMulti;
     
     if (isLong && questionTypeSettings.long) { targetLong++; actualLong += (q.attempts || 0); }
     else if (isMulti && questionTypeSettings.multi) { targetMulti++; actualMulti += (q.attempts || 0); }
     else if (isMcc && questionTypeSettings.mcc) { targetMcc++; actualMcc += (q.attempts || 0); }
  }
  
  const totalTargets = targetLong + targetMcc + targetMulti;
  const totalAttempts = actualLong + actualMcc + actualMulti;
  
  if (totalTargets === 0 || totalAttempts === 0) return activeDeck;
  
  const expectedLong = (targetLong / totalTargets) * totalAttempts;
  const expectedMcc = (targetMcc / totalTargets) * totalAttempts;
  const expectedMulti = (targetMulti / totalTargets) * totalAttempts;
  
  const deficitLong = expectedLong - actualLong;
  const deficitMcc = expectedMcc - actualMcc;
  const deficitMulti = expectedMulti - actualMulti;
  
  let maxDeficit = -Infinity;
  let targetType = null;
  
  if (questionTypeSettings.mcc && targetMcc > 0 && deficitMcc > maxDeficit) {
     maxDeficit = deficitMcc; targetType = 'mcc';
  }
  if (questionTypeSettings.long && targetLong > 0 && deficitLong > maxDeficit) {
     maxDeficit = deficitLong; targetType = 'long';
  }
  if (questionTypeSettings.multi && targetMulti > 0 && deficitMulti > maxDeficit) {
     maxDeficit = deficitMulti; targetType = 'multi';
  }
  
  if (targetType) {
     const filteredProportional = activeDeck.filter(q => {
        const isLong = q.type === 'long' || (!q.choices || q.choices.length === 0);
        const isMulti = q.correctAnswers && q.correctAnswers.length > 1;
        if (targetType === 'long') return isLong;
        if (targetType === 'multi') return isMulti;
        return !isLong && !isMulti;
     });
     if (filteredProportional.length > 0) return filteredProportional;
  }
  
  return activeDeck;
};

export const getSemanticallyPrioritizedCardIndex = (fullDeck, lowestScoreCards, cardEmbeddings) => {
  let attempted = fullDeck.filter(q => (q.attempts || 0) > 0 && !q.isMastered);
  let targetEmbeddings = [];
  
  if (attempted.length > 0) {
     attempted.sort((a,b) => (a.score || 0) - (b.score || 0));
     const lowestAttemptedScore = attempted[0].score || 0;
     const weakestCards = attempted.filter(q => (q.score || 0) === lowestAttemptedScore);
     targetEmbeddings = weakestCards.map(q => cardEmbeddings && cardEmbeddings[q.id]).filter(Boolean);
  }
  
  if (targetEmbeddings.length > 0) {
      const weaknessVector = new Array(targetEmbeddings[0].length).fill(0);
      for(const emb of targetEmbeddings) {
         for(let i = 0; i < emb.length; i++) weaknessVector[i] += emb[i];
      }
      for(let i = 0; i < weaknessVector.length; i++) weaknessVector[i] /= targetEmbeddings.length;

      const sortedBySimilarity = [...lowestScoreCards].sort((a, b) => {
         const simA = (cardEmbeddings && cardEmbeddings[a.id]) ? cosineSimilarity(cardEmbeddings[a.id], weaknessVector) : 0;
         const simB = (cardEmbeddings && cardEmbeddings[b.id]) ? cosineSimilarity(cardEmbeddings[b.id], weaknessVector) : 0;
         return simB - simA; 
      });
      return fullDeck.findIndex(q => q.id === sortedBySimilarity[0].id);
  }
  
  // Fallback to random if semantic analysis fails
  const selected = lowestScoreCards[Math.floor(Math.random() * lowestScoreCards.length)];
  return fullDeck.findIndex(q => q.id === selected.id);
};

export const getDueCards = (activeDeck, currentTurn = 0) => {
  let dueCards = activeDeck.filter(q => q.dueTurn <= currentTurn && !q.isMastered);
  if (dueCards.length === 0) {
    dueCards = activeDeck.filter(q => !q.isMastered);
  }
  return dueCards;
};

// --- REACT HOOK ---

export function useStudyEngine({
  currentDeck,
  setCurrentDeck,
  setStreak,
  setCurrentIndex,
  currentIndex,
  t,
  focusMode,
  questionTypeSettings,
  cardEmbeddings,
  cardOrderMode,
  loadedDeckId,
  setMyDecks,
  showToast
}) {

  const computeActiveDeckPool = useCallback((deck) => {
    if (!deck || deck.length === 0) return [];
    
    let activeDeck = deck;
    activeDeck = applyFocusModeFilter(activeDeck, focusMode, cardEmbeddings);
    activeDeck = applyQuestionTypeFilter(activeDeck, questionTypeSettings);
    
    return activeDeck;
  }, [focusMode, cardEmbeddings, questionTypeSettings]);

  const selectNextCard = useCallback((deck) => {
    if (!deck || deck.length === 0) return 0;
    
    // 1. Compute Base Active Pool
    let activeDeck = computeActiveDeckPool(deck);

    // 2. Apply Proportional Delivery Deficit
    activeDeck = applyProportionalDeficit(activeDeck, deck, questionTypeSettings);

    // 3. Filter by Spaced Repetition Due Dates
    let dueCards = getDueCards(activeDeck, 0);

    // Safety fallback
    if (dueCards.length === 0) {
      return deck.findIndex(q => q.id === (activeDeck[0] ? activeDeck[0].id : deck[0].id)); 
    }

    // 4. Sort by Lowest Score
    dueCards.sort((a, b) => (a.score || 0) - (b.score || 0));
    const lowestScore = dueCards[0].score || 0;
    const lowestScoreCards = dueCards.filter(q => (q.score || 0) === lowestScore);

    // 5. Apply Final Card Ordering Resolution
    if (cardOrderMode === 'random') {
      const selected = lowestScoreCards[Math.floor(Math.random() * lowestScoreCards.length)];
      return deck.findIndex(q => q.id === selected.id);
    } else if (cardOrderMode === 'semantic') {
      return getSemanticallyPrioritizedCardIndex(deck, lowestScoreCards, cardEmbeddings);
    } else {
      // Default: Sequential/Absolute First
      return deck.findIndex(q => q.id === lowestScoreCards[0].id);
    }
  }, [cardOrderMode, cardEmbeddings, questionTypeSettings, computeActiveDeckPool]);

  const updateCardStats = useCallback((id, newScore, firstTry, skipped) => {
    let nextDeck;
    setCurrentDeck(prev => {
      nextDeck = [...prev];
      const idx = nextDeck.findIndex(q => q.id === id);
      if (idx === -1) return prev;

      const card = { ...nextDeck[idx] };
      card.score = newScore;
      card.attempts = (card.attempts || 0) + 1;
      
      const interval = Math.max(1, Math.floor(Math.pow(2, newScore - 5))); 
      card.dueTurn = 0 + interval; 

      if (newScore >= 8) card.isMastered = true;
      else card.isMastered = false;

      nextDeck[idx] = card;
      
      if (loadedDeckId && setMyDecks) {
         setMyDecks(currDecks => currDecks.map(d => {
            if (d.id === loadedDeckId) {
               return { ...d, deck: nextDeck };
            }
            return d;
         }));
      }

      return nextDeck;
    });

    if (skipped) {
      setStreak(0);
      if (showToast) showToast(t?.skippedCard || "Card Skipped. Review Later.");
    } else if (firstTry && newScore >= 8) {
      setStreak(s => s + 1);
      if (showToast) showToast(t?.perfectRecall || "Perfect Recall! Mastering rapidly.");
    } else if (firstTry) {
      setStreak(s => s + 1);
      if (showToast) showToast(t?.correctAnswer || "Correct!");
    } else {
      setStreak(0);
    }

    if (nextDeck) {
      setCurrentIndex(selectNextCard(nextDeck));
    }
  }, [t, showToast, loadedDeckId, selectNextCard, setCurrentDeck, setMyDecks, setStreak, setCurrentIndex]);

  const handleManualNavigation = useCallback((dir) => {
    if (currentDeck.length === 0) return;
    const pool = computeActiveDeckPool(currentDeck);
    const activeDeckPool = pool.length > 0 ? pool : currentDeck;
    const currentCard = currentDeck[currentIndex];

    let poolIdx = activeDeckPool.findIndex(q => q.id === currentCard?.id);
    if (poolIdx === -1) poolIdx = 0;

    let nextPoolIdx = poolIdx + dir;
    if (nextPoolIdx < 0) nextPoolIdx = activeDeckPool.length - 1;
    if (nextPoolIdx >= activeDeckPool.length) nextPoolIdx = 0;

    const nextCard = activeDeckPool[nextPoolIdx];
    const nextIdx = currentDeck.findIndex(q => q.id === nextCard.id);
    setCurrentIndex(nextIdx !== -1 ? nextIdx : 0);
  }, [currentDeck, currentIndex, computeActiveDeckPool, setCurrentIndex]);

  return {
    computeActiveDeckPool,
    selectNextCard,
    updateCardStats,
    handleManualNavigation
  };
}
