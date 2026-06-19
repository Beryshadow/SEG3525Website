import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSharedLogic } from '../utilities/shared'; 
import CardGame from './gameFiles/CardGame.js';
import SwipeGame from './gameFiles/PasswordGame.js';
import { GAME_TRANSLATIONS } from '../data/gameData';
import { GameContext, useLocalStorage } from '../utilities/GameContext'; 
import '../App.css';
import '../stylesheets/Games.css';

const THEME_OPTIONS = [
  { id: 'rust-ayu', color: '#0f1419', label: 'Rust Ayu' },
  { id: 'dark', color: '#182429', label: 'Default Dark' },
  { id: 'rust-dark', color: '#353535', label: 'Rust Dark' },
  { id: 'ocean', color: '#0a192f', label: 'Dark Ocean' },
  { id: 'light', color: '#e0e5ec', label: 'Default Light' },
  { id: 'rust-light', color: '#ffffff', label: 'Rust Light' },
];

export default function App() {
  const navigate = useNavigate();
  const {
    lang, activeSection, isMobileMenuOpen, menuRef, toggleRef,
    toggleMobileMenu, closeMobileMenu, toggleLang, handleScrollToSection
  } = useSharedLogic(['card-game', 'password-swipe']);

  const [appTheme, setAppTheme] = useLocalStorage('app-custom-theme', 'dark');
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

  const themeClass = appTheme === 'light' ? 'light-mode' : (appTheme === 'dark' ? '' : `theme-${appTheme}`);

  useEffect(() => {
    const htmlElement = document.documentElement;
    
    htmlElement.classList.remove('light-mode', 'theme-rust-light', 'theme-rust-dark', 'theme-rust-ayu', 'theme-ocean');
    
    if (themeClass) {
      htmlElement.classList.add(themeClass);
    }
    
    document.body.style.backgroundColor = 'var(--bg-main)';
    document.body.style.color = 'var(--text-main)';
    document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';

    return () => {
      htmlElement.classList.remove('theme-rust-light', 'theme-rust-dark', 'theme-rust-ayu', 'theme-ocean');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [themeClass]);

  return (
    <GameContext.Provider value={{ appTheme, setAppTheme }}>
      <div 
        className={`${themeClass} game-route`}
        style={{ 
          backgroundColor: 'var(--bg-main)', 
          color: 'var(--text-main)', 
          minHeight: '100vh', 
          transition: 'background-color 0.5s ease, color 0.5s ease' 
        }}
      >
        <div className="font-sans antialiased overflow-clip min-h-screen">

          {/* Navigation Mobile */}
          <nav className="navbar navbar-dark d-lg-none sticky-top z-50 w-full px-4 pt-4 mb-8">
            <div className="neu-panel w-100 px-4 py-3 flex justify-between items-center">
              <a className="font-bold tracking-wider text-accent" href="#card-game">JEUX</a>
              <div className="flex items-center gap-2">
                <button onClick={toggleLang} className="neu-btn w-10 h-10 flex align-items-center justify-center font-bold text-xs text-textMain hover:scale-105 transition-transform shrink-0">
                  <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
                </button>
                <button
                  ref={toggleRef}
                  className="neu-btn w-10 h-10 flex align-items-center justify-center text-textMain hover:scale-105 transition-transform shrink-0 border-0"
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
                          <i className={`fas ${item.icon} w-5 text-center text-accent`}></i>
                          <span>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2 justify-center border-t border-gray-500 pt-4 opacity-80">
                    {THEME_OPTIONS.map(tOpt => (
                      <button key={tOpt.id} onClick={() => setAppTheme(tOpt.id)} className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform" style={{ backgroundColor: tOpt.color, borderColor: appTheme === tOpt.id ? 'var(--accent)' : 'transparent' }} aria-label={`Thème ${tOpt.label}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          <h1 className="sr-only">Mini Jeux</h1>
          <div className="container-fluid max-w-[1500px] mx-auto py-8 lg:py-16 px-4 lg:px-8">
            <div className="row g-5">

              {/* Sidebar Desktop*/}
              <aside id='NavMenu' className="col-lg-2 d-none d-lg-block">
                <div className="sticky top-12 flex flex-col gap-8">
                  <div id='info-card' aria-label='card-panel' className="neu-panel p-6 text-center">
                    <span className="font-extrabold text-xl tracking-wider text-accent block mb-2">RB</span>
                    <span className="text-xs text-textMuted uppercase tracking-widest">Jeux</span>
                  </div>
                  <nav className="flex flex-col gap-4">
                    <Link to="/" className="neu-btn p-4 flex items-center gap-4 text-sm font-bold">
                      <i className="fas fa-arrow-left w-5 text-center"></i>
                      <span>{t.navReturn}</span>
                    </Link>
                    {navItems.map((item) => (
                      <button key={item.id} id={item.id} aria-label={item.id} type="button" onClick={() => handleScrollToSection(item.id)} className={`neu-btn p-4 flex items-center gap-4 text-sm font-bold nav-item text-left w-full ${activeSection === item.id ? 'active' : ''}`}>
                        <i className={`fas ${item.icon} w-5 text-center`}></i>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Contenu Principal */}
              <main className="col-lg-9">
                <SwipeGame t={t} />
                <CardGame t={t} />
              </main>

              {/* Panneau Theme Desktop*/}
              <aside id="ThemeAndLang" className="col-lg-1 d-none d-lg-block">
                <div className="sticky top-12 flex flex-col items-center gap-4">
                  <button onClick={toggleLang} className="neu-btn w-12 h-12 flex items-center justify-center font-bold" title={t.navThemeTitle}>
                    {lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}
                  </button>

                  <div className="neu-panel p-2 flex flex-col gap-3 mt-4 rounded-full items-center">
                    {THEME_OPTIONS.map(tOpt => (
                      <button 
                        key={tOpt.id} 
                        onClick={() => setAppTheme(tOpt.id)} 
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110" 
                        style={{ backgroundColor: tOpt.color, borderColor: appTheme === tOpt.id ? 'var(--accent)' : 'transparent' }} 
                        title={tOpt.label}
                        aria-label={`Activer le thème ${tOpt.label}`}
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
