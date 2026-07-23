export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const getCorrectAnswers = (q) => {
  if (!q) return [];
  return q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []);
};

export const getTokenHash = (token) => {
  if (!token) return "";
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return positive.toString(36).substring(0, 3).toUpperCase().padStart(3, '0');
};

/**
 * Deterministically computes a hue angle (0-359) from a deck string (name or id).
 */
export const getDeckHue = (str) => {
  if (!str) return 210;
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
     hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

/**
 * Returns custom CSS variables for `--bg-main`, `--accent`, etc. tailored to light/dark mode and deck hue.
 */
export const getDeckThemeStyles = (deckIdentifier, appTheme = 'dark') => {
  if (!deckIdentifier) return {};
  const H = getDeckHue(deckIdentifier);
  const isDark = appTheme !== 'light';

  if (isDark) {
    return {
      '--bg-main': `hsl(${H}, 24%, 12%)`,
      '--accent': `hsl(${H}, 75%, 62%)`,
      '--text-main': `hsl(${H}, 15%, 88%)`,
      '--text-muted': `hsl(${H}, 12%, 62%)`,
      '--shadow-d': `rgba(0, 0, 0, 0.55)`,
      '--shadow-d-strong': `rgba(0, 0, 0, 0.75)`,
      '--shadow-l': `hsl(${H}, 24%, 17%)`,
      '--border-d': `rgba(0, 0, 0, 0.4)`,
      '--grad-l': `rgba(255, 255, 255, 0.03)`,
      '--grad-d': `rgba(0, 0, 0, 0.12)`
    };
  } else {
    return {
      '--bg-main': `hsl(${H}, 22%, 91%)`,
      '--accent': `hsl(${H}, 70%, 35%)`,
      '--text-main': `hsl(${H}, 25%, 25%)`,
      '--text-muted': `hsl(${H}, 15%, 45%)`,
      '--shadow-d': `hsl(${H}, 20%, 75%)`,
      '--shadow-d-strong': `hsl(${H}, 20%, 65%)`,
      '--shadow-l': `rgba(255, 255, 255, 0.85)`,
      '--border-d': `hsl(${H}, 20%, 80%)`,
      '--grad-l': `rgba(255, 255, 255, 0.45)`,
      '--grad-d': `hsl(${H}, 20%, 84%)`
    };
  }
};


/**
 * Smart Progress Reconciliator: Merges local and cloud state without data loss.
 * Prioritizes higher study progress for cards/decks and merges deck collections.
 */
export const reconcileProgressData = (localData = {}, cloudData = {}) => {
  if (!localData || !localData.myDecks) return cloudData || {};
  if (!cloudData || !cloudData.myDecks) return localData || {};

  // Helper to reconcile progress of two card items
  const reconcileCard = (cardA, cardB) => {
    if (!cardA) return cardB;
    if (!cardB) return cardA;

    const attemptsA = cardA.attempts || 0;
    const attemptsB = cardB.attempts || 0;
    const scoreA = cardA.score || 0;
    const scoreB = cardB.score || 0;
    const masteredA = !!(cardA.isMastered || cardA.mastered);
    const masteredB = !!(cardB.isMastered || cardB.mastered);

    const isMastered = masteredA || masteredB;
    const score = Math.max(scoreA, scoreB);
    const attempts = Math.max(attemptsA, attemptsB);
    const lastReviewed = (cardA.lastReviewed && cardB.lastReviewed)
      ? (new Date(cardA.lastReviewed) > new Date(cardB.lastReviewed) ? cardA.lastReviewed : cardB.lastReviewed)
      : (cardA.lastReviewed || cardB.lastReviewed);

    let history = Array.isArray(cardA.history) ? [...cardA.history] : [];
    if (Array.isArray(cardB.history)) {
      const existing = new Set(history.map(h => h.timestamp || h.date || JSON.stringify(h)));
      for (const h of cardB.history) {
        if (h && !existing.has(h.timestamp || h.date || JSON.stringify(h))) {
          history.push(h);
        }
      }
    }

    const base = attemptsB >= attemptsA ? cardB : cardA;
    return {
      ...base,
      score,
      attempts,
      isMastered,
      mastered: isMastered,
      lastReviewed,
      history
    };
  };

  // Helper to reconcile a card array (deck)
  const reconcileCardArray = (cardsA = [], cardsB = []) => {
    const cardMap = new Map();
    for (const card of cardsA) {
      const key = card.id || card.question;
      if (key) cardMap.set(key, card);
    }
    const result = [];
    const processedKeys = new Set();

    for (const cardB of cardsB) {
      const key = cardB.id || cardB.question;
      if (key && cardMap.has(key)) {
        const mergedCard = reconcileCard(cardMap.get(key), cardB);
        result.push(mergedCard);
        processedKeys.add(key);
      } else {
        result.push(cardB);
        if (key) processedKeys.add(key);
      }
    }

    for (const cardA of cardsA) {
      const key = cardA.id || cardA.question;
      if (key && !processedKeys.has(key)) {
        result.push(cardA);
      }
    }

    return result;
  };

  // 1. Reconcile `myDecks`
  const localDecks = Array.isArray(localData.myDecks) ? localData.myDecks : [];
  const cloudDecks = Array.isArray(cloudData.myDecks) ? cloudData.myDecks : [];
  const deckMap = new Map();

  for (const d of localDecks) {
    if (d && d.id) deckMap.set(d.id, d);
  }

  const mergedDecks = [];
  const processedDeckIds = new Set();

  for (const cloudDeck of cloudDecks) {
    if (!cloudDeck || !cloudDeck.id) continue;
    if (deckMap.has(cloudDeck.id)) {
      const localDeck = deckMap.get(cloudDeck.id);
      const mergedCardArray = reconcileCardArray(localDeck.deck || [], cloudDeck.deck || []);
      mergedDecks.push({
        ...localDeck,
        ...cloudDeck,
        name: cloudDeck.name || localDeck.name,
        completed: (cloudDeck.completed || localDeck.completed) && (mergedCardArray.length > 0 ? mergedCardArray.every(c => c.isMastered || c.mastered) : false),
        deck: mergedCardArray
      });
      processedDeckIds.add(cloudDeck.id);
    } else {
      mergedDecks.push(cloudDeck);
      processedDeckIds.add(cloudDeck.id);
    }
  }

  for (const localDeck of localDecks) {
    if (localDeck && localDeck.id && !processedDeckIds.has(localDeck.id)) {
      mergedDecks.push(localDeck);
    }
  }

  // 2. Reconcile `currentDeck`
  const mergedCurrentDeck = reconcileCardArray(localData.currentDeck || [], cloudData.currentDeck || []);

  // 3. Reconcile `streak`
  const mergedStreak = Math.max(localData.streak || 0, cloudData.streak || 0);

  return {
    ...cloudData,
    myDecks: mergedDecks,
    currentDeck: mergedCurrentDeck,
    streak: mergedStreak,
    loadedDeckId: cloudData.loadedDeckId !== undefined ? cloudData.loadedDeckId : localData.loadedDeckId
  };
};

