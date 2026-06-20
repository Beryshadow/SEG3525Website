import React, { useEffect, useReducer, useRef, useState } from 'react';
import { GAME_DATA } from '../../data/gameData';
import { useLocalStorage } from '../../utilities/GameContext';

const isImagePath = (str) => /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(str);
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateUniqueId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const fisherYatesShuffle = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const generateDeck = (gridSize, matchType, theme, t) => {
  const totalCards = gridSize * gridSize;
  const numGroups = Math.floor(totalCards / matchType);
  const wildcardCount = totalCards % matchType;
  let newDeck = [];

  for (let i = 0; i < numGroups; i++) {
    let group = [];
    if (theme === 'math') {
      const op = rnd(0, 3);
      let eq1, result, eq2;
      if (op === 0) { const a = rnd(1, 20); const b = rnd(1, 20); result = a + b; eq1 = `${a} + ${b}`; eq2 = `${result + a} - ${a}`; }
      else if (op === 1) { const a = rnd(10, 30); const b = rnd(1, 15); result = a - b; eq1 = `${a} - ${b}`; eq2 = `${result + b} - ${b}`; }
      else if (op === 2) { const a = rnd(2, 12); const b = rnd(2, 10); result = a * b; eq1 = `${a} × ${b}`; eq2 = `${result * 2} ÷ 2`; }
      else { const b = rnd(2, 10); const res = rnd(2, 12); const a = b * res; result = res; eq1 = `${a} ÷ ${b}`; eq2 = `${res * 3} ÷ 3`; }

      const groupId = result.toString();
      group.push({ text: eq1, groupId, isResult: false });
      group.push({ text: `${result}`, groupId, isResult: true });
      if (matchType === 3) group.push({ text: eq2, groupId, isResult: false });
    } else {
      const item = GAME_DATA[i % GAME_DATA.length];
      const translatedText = t?.gestalt?.[item.textKey] || item.textKey;

      group.push({ text: translatedText, groupId: i, isResult: true });
      group.push({ text: item.images[0], groupId: i, isResult: false });
      if (matchType === 3) {
        group.push({ text: item.images[1] || item.images[0], groupId: i, isResult: false });
      }
    }
    newDeck.push(...group);
  }

  for (let i = 0; i < wildcardCount; i++) {
    newDeck.push({ text: '★', groupId: 'wildcard', isWildcard: true, isResult: true });
  }

  return fisherYatesShuffle(newDeck)
    .map((card) => ({
      ...card,
      id: generateUniqueId(),
      isFlipped: false,
      isMatched: false,
      justMatched: false,
      hasBeenSeen: false,
      isMismatched: false
    }));
};

const initialState = {
  deck: [],
  flippedIndexes: [],
  isLocked: false,
  flips: 0,
  matches: 0,
  isWon: false,
  justWon: false,
  announcement: ''
};

const initGameState = (initial) => {
  try {
    const saved = window.localStorage.getItem('memory-board-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, justWon: false };
    }
    return initial;
  } catch (e) {
    return initial;
  }
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState, deck: action.payload.deck, announcement: action.payload.msg };

    case 'FLIP_CARD':
      const deckAfterFlip = [...state.deck];
      deckAfterFlip[action.payload.index].isFlipped = true;
      deckAfterFlip[action.payload.index].hasBeenSeen = true;
      return {
        ...state,
        deck: deckAfterFlip,
        flippedIndexes: [...state.flippedIndexes, action.payload.index],
        flips: state.flips + 1,
        announcement: `${action.payload.msg}${deckAfterFlip[action.payload.index].text}`
      };

    case 'LOCK_BOARD': return { ...state, isLocked: true };

    case 'MATCH_SUCCESS':
      return {
        ...state,
        deck: state.deck.map((c, i) => action.payload.indexes.includes(i) ? { ...c, isMatched: true, justMatched: true } : c),
        matches: state.matches + 1,
        flippedIndexes: [],
        isLocked: false,
        announcement: action.payload.msg
      };

    case 'CLEAR_MATCH_ANIMATION':
      return { ...state, deck: state.deck.map((c, i) => action.payload.indexes.includes(i) ? { ...c, justMatched: false } : c) };

    case 'MATCH_FAIL_SHAKE':
      return {
        ...state,
        deck: state.deck.map((c, i) => action.payload.indexes.includes(i) ? { ...c, isMismatched: true } : c),
        announcement: action.payload.msg
      };

    case 'MATCH_FAIL_RESET':
      return {
        ...state,
        deck: state.deck.map((c, i) => action.payload.indexes.includes(i) ? { ...c, isFlipped: false, isMismatched: false } : c),
        flippedIndexes: [],
        isLocked: false
      };

    case 'WIN_GAME': return { ...state, isWon: true, justWon: true, announcement: action.payload.msg };
    default: return state;
  }
}

export const CardGame = ({ t }) => {

  const [gridSize, setGridSize] = useLocalStorage('memory-grid', 4);
  const [matchType, setMatchType] = useLocalStorage('memory-match', 2);
  const [gameTheme, setGameTheme] = useLocalStorage('memory-theme', 'gestalt');

  const [state, dispatch] = useReducer(gameReducer, initialState, initGameState);
  const [highScores, setHighScores] = useLocalStorage('memory-high-scores', []);

  const [showConfetti, setShowConfetti] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    window.localStorage.setItem('memory-board-state', JSON.stringify(state));
  }, [state]);


  useEffect(() => {
    if (!hasInitialized.current) {
      if (!state.deck || state.deck.length === 0) {
        dispatch({
          type: 'START_GAME',
          payload: {
            deck: generateDeck(gridSize, matchType, gameTheme, t),
            msg: t?.memoryAlertNewGame || 'New game started!'
          }
        });
      }
      hasInitialized.current = true;
    }
  }, [gridSize, matchType, gameTheme, state.deck, t]);

  useEffect(() => {
    if (state.justWon) {
      setShowConfetti(true);
      setIsPulsing(true);

      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
      const pulseTimer = setTimeout(() => setIsPulsing(false), 800);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(pulseTimer);
      };
    } else {
      setShowConfetti(false);
      setIsPulsing(false);
    }
  }, [state.justWon]);

  const startNewGame = (overrideGrid, overrideMatch, overrideTheme) => {
    const g = overrideGrid || gridSize;
    const m = overrideMatch || matchType;
    const theme = overrideTheme || gameTheme;

    dispatch({
      type: 'START_GAME',
      payload: {
        deck: generateDeck(g, m, theme, t),
        msg: t?.memoryAlertNewGame || 'New game started!'
      }
    });
  };

  const handleGridChange = (e) => {
    const val = Number(e.target.value);
    setGridSize(val);
    startNewGame(val, matchType, gameTheme);
  };

  const handleMatchChange = (e) => {
    const val = Number(e.target.value);
    setMatchType(val);
    startNewGame(gridSize, val, gameTheme);
  };

  const handleThemeChange = (e) => {
    const val = e.target.value;
    setGameTheme(val);
    startNewGame(gridSize, matchType, val);
  };

  const handleCardClick = (index) => {
    const card = state.deck[index];
    if (state.isLocked || card.isFlipped || card.isMatched || card.isWildcard) return;

    dispatch({
      type: 'FLIP_CARD',
      payload: {
        index,
        msg: t?.memoryAlertFlip || 'Card flipped: '
      }
    });

    const newFlipped = [...state.flippedIndexes, index];
    if (newFlipped.length === matchType) {
      dispatch({ type: 'LOCK_BOARD' });
      checkMatch(newFlipped, state.deck);
    }
  };

  const checkMatch = (flippedIndexes, currentDeck) => {
    const firstGroupId = currentDeck[flippedIndexes[0]].groupId;
    const isMatch = flippedIndexes.every(idx => currentDeck[idx].groupId === firstGroupId);

    if (isMatch) {
      setTimeout(() => {
        dispatch({
          type: 'MATCH_SUCCESS',
          payload: {
            indexes: flippedIndexes,
            msg: t?.memoryAlertMatchSuccess || 'Excellent pair found!'
          }
        });
        setTimeout(() => dispatch({ type: 'CLEAR_MATCH_ANIMATION', payload: { indexes: flippedIndexes } }), 800);
      }, 500);
    } else {
      setTimeout(() => {
        dispatch({
          type: 'MATCH_FAIL_SHAKE',
          payload: {
            indexes: flippedIndexes,
            msg: t?.memoryAlertMatchFail || 'No match.'
          }
        });
        setTimeout(() => dispatch({ type: 'MATCH_FAIL_RESET', payload: { indexes: flippedIndexes } }), 400);
      }, 700);
    }
  };

  const totalPossibleMatches = Math.floor((gridSize * gridSize) / matchType);

  useEffect(() => {
    if (state.matches > 0 && state.matches === totalPossibleMatches && !state.isWon) {
      dispatch({
        type: 'WIN_GAME',
        payload: { msg: t?.memoryAlertWin || 'Congratulations, you won!' }
      });

      const expectedFlips = Math.max(1, state.matches) * matchType * 1.61;
      const efficiency = Math.min(100, Math.round((expectedFlips / state.flips) * 100));

      const newScore = { date: new Date().toLocaleDateString(), flips: state.flips, efficiency, mode: `${gridSize}x${gridSize}` };
      setHighScores(prev => [...prev, newScore].sort((a, b) => b.efficiency - a.efficiency).slice(0, 3));
    }
  }, [state.matches, totalPossibleMatches, state.isWon, state.flips, matchType, gridSize, setHighScores, t]);

  let efficiency = 100;
  if (state.flips > 0) {
    const expectedFlips = Math.max(1, state.matches) * matchType * 1.61;
    efficiency = Math.min(100, Math.round((expectedFlips / state.flips) * 100));
  }

  return (
    <section id="card-game" className="mb-32 relative flex flex-col items-center min-h-[calc(100vh-100px)] w-full">

      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {state.announcement}
      </div>

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
          {[...Array(60)].map((_, i) => (
            <div key={i} className="confetti-particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 2}s`, backgroundColor: ['var(--color-accent)', '#fff', 'var(--color-textMain)'][Math.floor(Math.random() * 3)] }} />
          ))}
        </div>
      )}

      <div className="mb-8 text-center w-full">
        <h2 className="text-3xl font-bold text-color-accent mb-2">{t?.memoryTitle || 'Jeu de Mémoire'}</h2>
        <p className="text-color-textMuted max-w-2xl mx-auto">{t?.memorySubtitle || 'Testez vos capacités cognitives.'}</p>
      </div>

      <div className="neu-panel p-6 mb-8 flex flex-col gap-6 bg-color-surface shadow-md rounded-2xl relative z-10 w-full max-w-4xl">
        <div className="flex flex-wrap gap-6 items-center justify-center">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-color-textMuted uppercase tracking-wider" htmlFor="grid-select">{t?.memoryGridLabel || 'Grille'}</label>
            <select id="grid-select" className="neu-pressed px-4 py-2 text-color-textMain border-0 outline-none bg-transparent rounded-xl" value={gridSize} onChange={handleGridChange}>
              <option value={4}>4 x 4</option>
              <option value={5}>5 x 5</option>
              <option value={6}>6 x 6</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-color-textMuted uppercase tracking-wider" htmlFor="match-select">{t?.memoryPairTypeLabel || 'Type de Paire'}</label>
            <select id="match-select" className="neu-pressed px-4 py-2 text-color-textMain border-0 outline-none bg-transparent rounded-xl" value={matchType} onChange={handleMatchChange}>
              <option value={2}>{t?.memoryPairsOption || 'Paires (2)'}</option>
              <option value={3}>{t?.memoryTripletsOption || 'Triplets (3)'}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-color-textMuted uppercase tracking-wider" htmlFor="theme-select">{t?.memoryThemeLabel || 'Thème'}</label>
            <select id="theme-select" className="neu-pressed px-4 py-2 text-color-textMain border-0 outline-none bg-transparent rounded-xl" value={gameTheme} onChange={handleThemeChange}>
              <option value="gestalt">{t?.memoryThemeGestalt || 'Principes Gestalt'}</option>
              <option value="math">{t?.memoryThemeMath || 'Équations Mathématiques'}</option>
            </select>
          </div>
          <div className="mt-2 md:mt-0 md:ml-auto">
            <button onClick={() => startNewGame()} className="neu-btn px-6 py-3 font-bold text-color-accent rounded-xl hover:bg-opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-color-accent">
              <i className="fas fa-rotate-right mr-2"></i> {t?.memoryBtnRestart || 'Recommencer'}
            </button>
          </div>
        </div>

        <hr className="border-color-textMuted opacity-20" />

        <div className="flex justify-around items-center text-center">
          <div>
            <p className="text-xs text-color-textMuted uppercase font-bold tracking-wider mb-1">{t?.memoryFlipsLabel || 'Coups'}</p>
            <p className="text-xl font-bold text-color-textMain">{state.flips}</p>
          </div>
          <div>
            <p className="text-xs text-color-textMuted uppercase font-bold tracking-wider mb-1">{t?.memoryMatchesLabel || 'Correspondances'}</p>
            <p className="text-xl font-bold text-color-textMain">{state.matches} / {totalPossibleMatches}</p>
          </div>
          <div>
            <p className="text-xs text-color-textMuted uppercase font-bold tracking-wider mb-1">{t?.memoryEfficiencyLabel || 'Efficacité'}</p>
            <p className={`text-xl font-bold ${efficiency >= 100 ? 'text-success' : 'text-color-accent'}`}>{efficiency}%</p>
          </div>
        </div>
      </div>

      <div
        className={`game-board w-full mx-auto transition-all duration-700 ${state.isWon ? 'board-won neu-flat' : ''} ${isPulsing ? 'scale-105 shadow-[0_0_40px_var(--color-accent)] z-20 relative' : 'scale-100'}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: 'clamp(0.25rem, 1.5vmin, 1rem)',
          width: '100%',
          maxWidth: 'min(100%, calc(100vh - 380px))',
          aspectRatio: '1 / 1'
        }}
      >
        {state.deck.map((card, index) => {
          let ariaLabel = `${t?.memoryCardHiddenAria || 'Hidden card'} ${index + 1}`;
          if (card.isMatched) ariaLabel = `${t?.memoryCardMatchedAria || 'Pair found: '}${card.text}`;
          else if (card.isFlipped) ariaLabel = `${t?.memoryCardFlippedAria || 'Card flipped: '}${card.text}`;

          return (
            <button
              key={card.id}
              className={`
    card-scene w-full h-full text-left outline-none cursor-pointer
    focus-visible:ring-4 focus-visible:ring-color-accent focus-visible:ring-offset-4 focus-visible:ring-offset-color-surface rounded-2xl
    ${card.isFlipped || card.isMatched || card.isWildcard ? 'is-flipped' : ''}
    ${card.justMatched ? 'animate-success' : ''}
    ${card.isMismatched ? 'animate-shake' : ''}
    ${card.isMatched && !card.justMatched ? 'opacity-50 scale-95 transition-all duration-500' : ''}
    ${card.isWildcard ? 'opacity-30 cursor-not-allowed' : ''}
  `}
              onClick={() => handleCardClick(index)}
              onKeyDown={(e) => e.key === "Enter" && handleCardClick(index)}
              disabled={card.isWildcard || card.isMatched}
              tabIndex={card.isMatched ? -1 : 0}
            >
            <span className="sr-only">{ariaLabel}</span>
              <div className="card-flipper h-full w-full relative preserve-3d transition-transform duration-500 pointer-events-none">
                <div className="card-face card-front neu-btn w-full h-full absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden">
                  <i className="fas fa-question text-color-textMuted opacity-20 text-xl lg:text-3xl"></i>
                  {card.hasBeenSeen && !card.isMatched && (
                    <span className="!absolute top-3 right-3 sm:top-4 sm:right-4 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-color-accent opacity-100 shadow-[0_0_12px_var(--color-accent),_0_0_24px_var(--color-accent)] animate-pulse" title={t?.memorySeenBadgeTitle || 'Card already seen'}></span>
                  )}
                </div>

                <div className="card-face card-back neu-pressed w-full h-full absolute inset-0 flex items-center justify-center rounded-2xl p-1 sm:p-2 md:p-4 backface-hidden [transform:rotateY(180deg)]">
                  {isImagePath(card.text) ? (
                    <img src={card.text} alt="" className="w-full h-full object-contain rounded-lg pointer-events-none drop-shadow-md" />
                  ) : (
                    <span className={`font-bold text-center text-xs md:text-sm lg:text-base ${card.isResult ? 'text-color-accent text-lg md:text-xl lg:text-2xl' : 'text-color-textMain'}`}>
                      {card.text}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {highScores.length > 0 && (
        <div className="mt-12 w-full max-w-lg mx-auto">
          <div className="neu-panel p-6">
            <h3 className="text-xl font-bold text-color-accent text-center mb-4">
              <i className="fas fa-trophy mr-2"></i> {t?.memoryHighScoreTitle || 'High Scores'}
            </h3>
            <ul className="flex flex-col gap-3">
              {highScores.map((score, i) => (
                <li key={i} className="flex justify-between text-sm text-color-textMain border-b border-gray-600/30 pb-2">
                  <span>{score.mode} - {score.date}</span>
                  <span className="font-bold text-color-accent">{score.efficiency}% ({score.flips} {t?.memoryFlipsUnit || 'flips'})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </section>
  );
};

export default CardGame;
