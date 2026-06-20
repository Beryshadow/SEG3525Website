import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSharedLogic } from '../utilities/shared';
import CardGame from './gameFiles/CardGame.js';
import SwipeGame from './gameFiles/PasswordGame.js';
import { GAME_TRANSLATIONS } from '../data/gameData';
import { GameContext } from '../utilities/GameContext';
import '../App.css';
import '../stylesheets/Games.css';

const THEME_OPTIONS = [
  { id: 'theme-rust-ayu', color: '#0f1419', label: 'Rust Ayu' },
  { id: 'dark', color: '#182429', label: 'Default Dark' },
  { id: 'theme-rust-dark', color: '#353535', label: 'Rust Dark' },
  { id: 'theme-ocean', color: '#0a192f', label: 'Dark Ocean' },
  { id: 'light', color: '#e0e5ec', label: 'Default Light' },
  { id: 'theme-rust-light', color: '#ffffff', label: 'Rust Light' },
];

export default function App() {
  const navigate = useNavigate();

  const {
    appTheme,
    setAppTheme,
    lang,
    activeSection,
    isMobileMenuOpen,
    menuRef,
    toggleRef,
    toggleMobileMenu,
    closeMobileMenu,
    toggleLang,
    handleScrollToSection
  } = useSharedLogic(['card-game', 'password-swipe']);

  const t = GAME_TRANSLATIONS[lang.toUpperCase()] || GAME_TRANSLATIONS['FR'];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const navItems = [
    { id: 'password-swipe', icon: 'fa-unlock-keyhole', label: t.navSwipeGame },
    { id: 'card-game', icon: 'fa-layer-group', label: t.navCardGame },
  ];

  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `${appTheme}`);

  return (
    <GameContext.Provider value={{ appTheme, setAppTheme }}>
      <div className={`${themeClass} game-route`}>
        <div className="font-sans antialiased overflow-clip min-h-screen">

          {/* Navigation Mobile */}
          <nav className="navbar navbar-dark d-lg-none sticky-top z-50 w-full px-4 pt-4 mb-8">
            <div className="neu-panel w-100 px-4 py-3 flex justify-between items-center">
              <a className="font-bold tracking-wider text-color-accent" href="#card-game">JEUX</a>
              <div className="flex items-center gap-2">
                <button onClick={toggleLang} className="neu-btn w-10 h-10 flex align-items-center justify-center font-bold text-xs text-color-textMain hover:scale-105 transition-transform shrink-0">
                  <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
                </button>
                <button
                  ref={toggleRef}
                  className="neu-btn w-10 h-10 flex align-items-center justify-center text-color-textMain hover:scale-105 transition-transform shrink-0 border-0"
                  onClick={toggleMobileMenu}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
              </div>
            </div>

            {isMobileMenuOpen && (
              <div ref={menuRef} className="mt-2 w-full px-2">
                <div className="neu-pressed p-4 w-full">
                  <ul className="navbar-nav gap-3 mb-4">
                    <Link to="/" className="nav-link-btn flex items-center gap-3 w-100 text-left">
                      <i className="fas fa-arrow-left w-5 text-center"></i>
                      <span>{t.navReturn}</span>
                    </Link>
                    {navItems.map((item) => (
                      <li key={item.id}>
                        <button className="nav-link-btn flex items-center gap-3 w-100 text-left" onClick={() => { handleScrollToSection(item.id); closeMobileMenu(); }}>
                          <i className={`fas ${item.icon} w-5 text-center text-color-accent`}></i>
                          <span>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2 justify-center border-t border-gray-500 pt-4 opacity-80">
                    {THEME_OPTIONS.map(tOpt => (
                      <button
                        key={tOpt.id}
                        onClick={() => setAppTheme(tOpt.id)}
                        className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform"
                        style={{ backgroundColor: tOpt.color, borderColor: appTheme === tOpt.id ? 'var(--color-accent)' : 'transparent' }}
                        aria-label={`${t.navThemeLabel} ${tOpt.label}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          <div className="container-fluid max-w-[1500px] mx-auto py-8 lg:py-16 px-4 lg:px-8">
            <div className="row g-5">

              {/* Sidebar Desktop */}
              <aside className="col-lg-2 d-none d-lg-block" aria-label="navigation menu">
                <div className="sticky top-12 flex flex-col gap-8">
                  <div id='info-card' aria-label='card-panel' className="neu-panel p-6 text-center">
                    <h1 className="font-extrabold text-xl tracking-wider text-color-accent block mb-2">RB</h1>
                    <span className="text-xs text-color-textMuted uppercase tracking-widest">{t.game ?? 'Jeux'}</span>
                  </div>
                  <nav className="flex flex-col gap-4">
                    <Link to="/" className="neu-btn p-4 flex items-center gap-4 text-sm font-bold">
                      <i className="fas fa-arrow-left w-5 text-center"></i>
                      <span>{t.navReturn}</span>
                    </Link>
                    {navItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => handleScrollToSection(item.id)} className={`neu-btn p-4 flex items-center gap-4 text-sm font-bold nav-item text-left w-full ${activeSection === item.id ? 'active' : ''}`}>
                        <i className={`fas ${item.icon} w-5 text-center`}></i>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Contenu Principal */}
              <main className="col-lg-8">
                <SwipeGame t={t} />
                <CardGame t={t} />
                <footer className="pt-8 pb-4 mt-16 text-center lg:text-left">
                  <div className="neu-pressed p-6 d-flex flex-column flex-lg-row justify-content-between align-items-center">
                    <div className="mb-4 mb-lg-0">
                      <h3 className="font-bold text-lg text-color-accent mb-1">Ryan Beland</h3>
                      <p className="text-sm text-color-textMuted mb-0">
                        <span>{t.footerCourse}</span>
                      </p>
                    </div>
                    <div className="text-center lg:text-right d-flex flex-column gap-1">
                      <p className="text-sm text-color-textMuted mb-0">
                        &copy; 2026 Université d'Ottawa / University of Ottawa.
                      </p>
                      <span className="text-xs text-color-textMuted opacity-80">
                        {t.footerUpdateLabel} {import.meta.env.VITE_BUILD_TIME}
                      </span>
                    </div>
                  </div>
                </footer>
              </main>

              {/* Panneau Theme Desktop */}
              <aside className="col-lg-2 d-none d-lg-block" aria-label="Options theme">
                <div className="sticky top-12 flex flex-col items-start gap-4">
                  <button onClick={toggleLang} className="neu-btn w-12 h-12 flex items-center justify-center font-bold" title={t.navThemeTitle}>
                    {lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}
                  </button>
                  <div className="neu-panel p-2 flex flex-col gap-3 mt-4 rounded-full items-center">
                    {THEME_OPTIONS.map(tOpt => (
                      <button
                        key={tOpt.id}
                        onClick={() => setAppTheme(tOpt.id)}
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: tOpt.color, borderColor: appTheme === tOpt.id ? 'var(--color-accent)' : 'transparent' }}
                        title={tOpt.label}
                        aria-label={`${t.navThemeLabel} ${tOpt.label}`}
                      />
                    ))}
                  </div>
                  <a href="#top" className="neu-btn w-12 h-12 flex items-center justify-center mt-8" title={t.navScrollTop}>
                    <i className="fas fa-arrow-up"></i>
                  </a>
                </div>
              </aside>

            </div>
          </div>
        </div>
      </div>
    </GameContext.Provider>
  );
}
