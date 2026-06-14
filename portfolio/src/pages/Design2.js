import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedLogic } from '../shared';
import { GAME_TRANSLATIONS, GAME_DATA } from '../data/gameData';
import '../App.css';
import '../Games.css';

// Helper 
const isImagePath = (str) => /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(str);
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


// Game logic
const generateDeck = (gridSize, matchType, theme) => {
  const totalCards = gridSize * gridSize;
  const numGroups = Math.floor(totalCards / matchType);
  const wildcardCount = totalCards % matchType;
  let newDeck = [];

  for (let i = 0; i < numGroups; i++) {
    let group = [];

    if (theme === 'math') {
      const op = rnd(0, 3);
      let eq1, result, eq2;

      if (op === 0) { // Addition
        const a = rnd(1, 20); const b = rnd(1, 20);
        result = a + b; eq1 = `${a} + ${b}`; eq2 = `${result + a} - ${a}`;
      } else if (op === 1) { // Subtraction
        const a = rnd(10, 30); const b = rnd(1, 15);
        result = a - b; eq1 = `${a} - ${b}`; eq2 = `${result + b} - ${b}`;
      } else if (op === 2) { // Multiplication
        const a = rnd(2, 12); const b = rnd(2, 10);
        result = a * b; eq1 = `${a} × ${b}`; eq2 = `${result * 2} ÷ 2`;
      } else { // Division
        const b = rnd(2, 10); const res = rnd(2, 12);
        const a = b * res;
        result = res; eq1 = `${a} ÷ ${b}`; eq2 = `${res * 3} ÷ 3`;
      }

      group.push({ text: eq1, groupId: i, isResult: false });
      group.push({ text: `${result}`, groupId: i, isResult: true });
      if (matchType === 3) group.push({ text: eq2, groupId: i, isResult: false });

    } else {
      const items = GAME_DATA[i % GAME_DATA.length];
      group.push({ text: items[0], groupId: i, isResult: false });
      group.push({ text: items[1], groupId: i, isResult: false });
      if (matchType === 3) group.push({ text: items[2], groupId: i, isResult: false });
    }

    newDeck.push(...group);
  }

  for (let i = 0; i < wildcardCount; i++) {
    newDeck.push({ text: '★', groupId: 'wildcard', isWildcard: true, isResult: true });
  }

  return newDeck
    .sort(() => Math.random() - 0.5)
    .map((card, id) => ({
      ...card, id, isFlipped: false, isMatched: false, justMatched: false, hasBeenSeen: false
    }));
};

// Main 
export default function GamePage() {
  const navigate = useNavigate();
  const {
    theme, lang, activeSection, isMobileMenuOpen, menuRef, toggleRef,
    toggleMobileMenu, closeMobileMenu, toggleTheme, toggleLang, handleScrollToSection
  } = useSharedLogic(['card-game', 'password-swipe']);

  const t = GAME_TRANSLATIONS[lang.toUpperCase()] || GAME_TRANSLATIONS['FR'];

  const [gridSize, setGridSize] = useState(4);
  const [matchType, setMatchType] = useState(2);
  const [gameTheme, setGameTheme] = useState('math');
  const [deck, setDeck] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  // Game stats
  const [flips, setFlips] = useState(0);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  useEffect(() => {
    startNewGame();
  }, [gridSize, matchType, gameTheme]);

  const startNewGame = () => {
    setDeck(generateDeck(gridSize, matchType, gameTheme));
    setFlippedCards([]);
    setIsLocked(false);
    setFlips(0);
    setMatches(0);
  };

  const handleCardClick = (index) => {
    const card = deck[index];
    if (isLocked || card.isFlipped || card.isMatched || card.isWildcard) return;

    setFlips(prev => prev + 1);

    const newDeck = [...deck];
    newDeck[index].isFlipped = true;
    newDeck[index].hasBeenSeen = true;
    setDeck(newDeck);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === matchType) {
      setIsLocked(true);
      checkMatch(newFlipped, newDeck);
    }
  };

  const checkMatch = (flippedIndexes, currentDeck) => {
    const firstGroupId = currentDeck[flippedIndexes[0]].groupId;
    const isMatch = flippedIndexes.every(idx => currentDeck[idx].groupId === firstGroupId);

    setTimeout(() => {
      let updatedDeck = [...currentDeck];
      flippedIndexes.forEach(idx => {
        if (isMatch) {
          updatedDeck[idx].isMatched = true;
          updatedDeck[idx].justMatched = true;
        } else {
          updatedDeck[idx].isFlipped = false;
        }
      });

      if (isMatch) setMatches(prev => prev + 1);

      setDeck(updatedDeck);
      setFlippedCards([]);
      setIsLocked(false);

      if (isMatch) {
        setTimeout(() => {
          setDeck(prevDeck => prevDeck.map((card, i) =>
            flippedIndexes.includes(i) ? { ...card, justMatched: false } : card
          ));
        }, 800);
      }
    }, 1000);
  };

  const navItems = [
    { id: 'card-game', icon: 'fa-layer-group', label: t.navCardGame },
    { id: 'password-swipe', icon: 'fa-unlock-keyhole', label: t.navSwipeGame }
  ];

  const totalPossibleMatches = Math.floor((gridSize * gridSize) / matchType);
  const efficiency = flips === 0 ? 100 : Math.round(((matches * matchType) / flips) * 100);

  return (
    <div className={`${theme === 'light' ? 'light-mode' : ''} game-route`}>
      <div className="font-sans antialiased overflow-clip">

        {/* Mobile Navigation */}
        <nav className="navbar navbar-dark d-lg-none sticky-top z-50 w-full px-4 pt-4 mb-8">
          <div className="neu-panel w-100 px-4 py-3 d-flex justify-content-between align-items-center">
            <a className="font-bold tracking-wider text-accent" href="#card-game">GAMES</a>
            <div className="d-flex align-items-center gap-2">
              <button onClick={toggleTheme} className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0">
                {theme === 'dark' ? <i className="fas fa-sun text-lg"></i> : <i className="fas fa-moon text-lg"></i>}
              </button>
              <button onClick={toggleLang} className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center font-bold text-xs text-textMain hover:scale-105 transition-transform shrink-0">
                <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
              </button>
              <button ref={toggleRef} className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0 border-0" onClick={toggleMobileMenu}>
                <i className="fas fa-bars text-lg"></i>
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div ref={menuRef} className="mt-2 w-full px-2">
              <div className="neu-pressed p-4 w-full">
                <ul className="navbar-nav gap-3">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <button className="nav-link-btn d-flex align-items-center gap-3 w-100 text-left" onClick={() => { handleScrollToSection(item.id); closeMobileMenu(); }}>
                        <i className={`fas ${item.icon} w-5 text-center text-accent`}></i>
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </nav>

        <div className="container-fluid max-w-[1500px] mx-auto py-8 lg:py-16 px-4 lg:px-8">
          <div className="row g-5">

            {/* Desktop Sidebar */}
            <div className="col-lg-2 d-none d-lg-block">
              <div className="sticky top-12 flex flex-col gap-8">
                <div className="neu-panel p-6 text-center">
                  <span className="font-extrabold text-xl tracking-wider text-accent block mb-2">RB</span>
                  <span className="text-xs text-textMuted uppercase tracking-widest">Jeu</span>
                </div>
                <nav className="flex flex-col gap-4" id="left-nav">
                  {navItems.map((item) => (
                    <button key={item.id} type="button" onClick={() => handleScrollToSection(item.id)} className={`neu-btn p-4 flex items-center gap-4 text-sm font-bold nav-item text-left w-full ${activeSection === item.id ? 'active' : ''}`}>
                      <i className={`fas ${item.icon} w-5 text-center`}></i>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-lg-9">

              {/* card game */}
              <section id="card-game" className="mb-32 min-h-screen">

                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-bold text-accent mb-2">{t.gameTitle}</h2>
                  <p className="text-textMuted max-w-2xl mx-auto">{t.gameSubtitle}</p>
                </div>

                {/* Controls & Stats Panel */}
                <div className="neu-panel p-6 mb-8 flex flex-col gap-6">
                  <div className="flex flex-wrap gap-6 items-center justify-center">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-textMuted uppercase tracking-wider">{t.gridLabel}</label>
                      <select className="neu-pressed px-4 py-2 text-textMain border-0 outline-none bg-transparent rounded-xl" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))}>
                        <option value={4}>{t.grid16}</option>
                        <option value={5}>{t.grid25}</option>
                        <option value={6}>{t.grid36}</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-textMuted uppercase tracking-wider">{t.matchLabel}</label>
                      <select className="neu-pressed px-4 py-2 text-textMain border-0 outline-none bg-transparent rounded-xl" value={matchType} onChange={(e) => setMatchType(Number(e.target.value))}>
                        <option value={2}>{t.matchPairs}</option>
                        <option value={3}>{t.matchTriplets}</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-textMuted uppercase tracking-wider">{t.themeLabel}</label>
                      <select className="neu-pressed px-4 py-2 text-textMain border-0 outline-none bg-transparent rounded-xl" value={gameTheme} onChange={(e) => setGameTheme(e.target.value)}>
                        <option value="math">{t.themeMath}</option>
                        <option value="words">{t.themeWords}</option>
                      </select>
                    </div>
                    <div className="mt-2 md:mt-0 md:ml-auto">
                      <button onClick={startNewGame} className="neu-btn px-6 py-3 font-bold text-accent">
                        <i className="fas fa-rotate-right mr-2"></i> {t.restartBtn}
                      </button>
                    </div>
                  </div>

                  <hr className="border-textMuted opacity-20" />

                  <div className="flex justify-around items-center text-center">
                    <div>
                      <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">Flips</p>
                      <p className="text-xl font-bold text-textMain">{flips}</p>
                    </div>
                    <div>
                      <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">Matches</p>
                      <p className="text-xl font-bold text-textMain">{matches} / {totalPossibleMatches}</p>
                    </div>
                    <div>
                      <p className="text-xs text-textMuted uppercase font-bold tracking-wider mb-1">Efficiency</p>
                      <p className="text-xl font-bold text-accent">{efficiency}%</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic 3D Game Grid */}
                <div
                  className="game-board w-full max-w-3xl mx-auto"
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: '1rem' }}
                >
                  {deck.map((card, index) => (
                    <div
                      key={card.id}
                      className={`
                      card-scene w-full aspect-square 
                      ${card.isFlipped || card.isMatched || card.isWildcard ? 'is-flipped' : ''}
                      ${card.justMatched ? 'animate-success' : ''}
                      ${card.isMatched && !card.justMatched ? 'opacity-50 scale-95 transition-all duration-500' : ''}
                      ${card.isWildcard ? 'opacity-30' : ''}
                    `}
                    >
                      <div className="card-flipper">
                        {/* Front Face */}
                        <button
                          className="card-face card-front neu-btn w-full h-full flex items-center justify-center rounded-2xl relative"
                          onClick={() => handleCardClick(index)}
                          disabled={card.isWildcard}
                        >
                          <i className="fas fa-question text-textMuted opacity-20 text-xl lg:text-3xl"></i>
                          {card.hasBeenSeen && !card.isMatched && (
                            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent opacity-60 shadow-[0_0_8px_var(--accent)]"></span>
                          )}
                        </button>

                        {/* Back Face */}
                        <div className="card-face card-back neu-pressed w-full h-full flex items-center justify-center rounded-2xl p-2">
                          {isImagePath(card.text) ? (
                            <img
                              src={card.text}
                              alt="card content"
                              className="max-w-full max-h-full object-contain rounded-lg pointer-events-none drop-shadow-md"
                            />
                          ) : (
                            <span className={`font-bold text-center text-sm lg:text-base ${card.isResult ? 'text-accent text-xl lg:text-2xl' : 'text-textMain'}`}>
                              {card.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 2 Placeholder) */}
              <section id="password-swipe" className="mb-32 min-h-screen flex flex-col justify-center">
                <div className="text-center text-lg-start mb-10 lg:ml-2">
                  <h2 className="text-3xl font-bold text-accent mb-2">{t.navSwipeGame}</h2>
                  <p className="text-textMuted">Test your spatial memory with complex swipe patterns.</p>
                </div>
                <div className="neu-panel p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <i className="fas fa-lock fa-4x text-accent opacity-50 mb-6"></i>
                  <h3 className="font-bold text-xl text-textMain mb-2">Coming Soon</h3>
                  <p className="text-textMuted max-w-md mx-auto">The swipe pattern memory mechanic is currently in development and will be integrated into this space.</p>
                </div>
              </section>

            </div>

            {/* Utility Panel */}
            <div className="col-lg-1 d-none d-lg-block">
              <div className="sticky top-12 flex flex-col items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="neu-btn w-14 h-14 flex items-center justify-center text-textMain hover:scale-105 transition-transform"
                >
                  {theme === 'dark' ? <i className="fas fa-sun text-xl"></i> : <i className="fas fa-moon text-xl"></i>}
                </button>
                <button onClick={toggleLang} className="neu-btn w-12 h-12 flex items-center justify-center font-bold" title="Toggle Language">
                  {lang === 'fr' ? 'EN' : 'FR'}
                </button>
                <a href="#top" className="neu-btn w-12 h-12 flex items-center justify-center mt-8" title="Retour en haut">
                  <i className="fas fa-arrow-up"></i>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
