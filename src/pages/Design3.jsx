import React from 'react';
import { Link } from 'react-router-dom';
import { useSharedLogic } from '../utilities/shared';
import '../App.css';

const TRANSLATIONS = {
  fr: {
    back: "Retour",
    comingSoon: "À venir",
    title: "Boutique d'arts",
    desc: "Prototype de boutique en ligne pour naviguer et acheter des créations artisanales.",
    navAbout: "À propos",
    navProjects: "Projets",
  },
  en: {
    back: "Go Back",
    comingSoon: "Coming Soon",
    title: "Art Shop",
    desc: "Online store prototype for browsing and purchasing handcrafted creations.",
    navAbout: "About",
    navProjects: "Projects",
  }
};

export default function Design3() {
  const {
    theme, lang,
    isMobileMenuOpen, menuRef, toggleRef, toggleMobileMenu, closeMobileMenu,
    toggleTheme, toggleLang
  } = useSharedLogic([]);

  const currentLang = (lang || 'fr').toLowerCase() === 'fr' ? 'fr' : 'en';
  const t = TRANSLATIONS[currentLang];

  return (
    <div className="font-sans antialiased overflow-x-hidden min-h-screen flex flex-col">

      {/* Mobile Navigation */}
      <nav className="navbar navbar-dark d-lg-none sticky-top pt-4 px-4 z-50">
        <div className="neu-panel w-100 px-4 py-3 d-flex justify-content-between align-items-center">
          <Link className="font-bold tracking-wider text-accent" to="/">RYAN BELAND</Link>
          <div className="d-flex gap-3 align-items-center">
            <button
              onClick={toggleTheme}
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0"
            >
              {theme === 'dark' ? <i className="fas fa-sun text-lg"></i> : <i className="fas fa-moon text-lg"></i>}
            </button>

            <button
              onClick={toggleLang}
              className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center font-bold text-xs text-textMain hover:scale-105 transition-transform shrink-0"
            >
              <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
            </button>

            <button
              ref={toggleRef} className="neu-btn w-10 h-10 d-flex d-lg-none align-items-center justify-content-center text-textMain hover:scale-105 transition-transform shrink-0 border-0"
              onClick={toggleMobileMenu}
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div ref={menuRef} className="mt-4 w-full">
            <div className="neu-pressed p-4">
              <ul className="navbar-nav gap-2">
                <li className="nav-item">
                  <Link className="nav-link text-[var(--text-main)]" to="/#about" onClick={closeMobileMenu}>
                    {t.navAbout}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-[var(--text-main)]" to="/#projects" onClick={closeMobileMenu}>
                    {t.navProjects}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
      </nav>

      {/* Main Layout */}
      <div className="container-fluid max-w-[1500px] mx-auto py-8 lg:py-16 px-4 lg:px-8 flex-grow">
        <div className="row h-100">

          {/* Desktop Left Sidebar */}
          <div className="col-lg-2 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col gap-8">
              <div className="neu-panel p-6 text-center">
                <span className="font-extrabold text-xl tracking-wider text-accent block mb-2">RB</span>
                <span className="text-xs text-textMuted uppercase tracking-widest">Portfolio</span>
              </div>
              <nav className="flex flex-col gap-4">
                <Link to="/" className="neu-btn p-4 flex items-center gap-4 text-sm font-bold">
                  <i className="fas fa-arrow-left w-5 text-center"></i>
                  <span>{t.back}</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Center Content */}
          <div className="col-lg-9 d-flex align-items-center justify-content-center">
            <div className="neu-panel p-10 text-center max-w-3xl w-100 mt-16 lg:mt-0">
              <div className="neu-pressed w-24 h-24 mx-auto flex items-center justify-center mb-8 rounded-full">
                <i className="fas fa-store fa-2x text-accent opacity-80"></i>
              </div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider mb-4 block">
                {t.comingSoon}
              </span>
              <h1 className="text-4xl font-extrabold mb-6">
                {t.title}
              </h1>
              <p className="text-xl text-textMuted mb-0">
                {t.desc}
              </p>
            </div>
          </div>

          {/* Desktop Right Sidebar (Utility) */}
          <div className="col-lg-1 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col items-center gap-4">
              <button onClick={toggleTheme} className="neu-btn w-12 h-12 flex items-center justify-center">
                {theme === 'dark' ? <i className="fas fa-sun theme-icon-sun text-lg"></i> : <i className="fas fa-moon theme-icon-moon text-lg"></i>}
              </button>
              <button onClick={toggleLang} className="neu-btn w-12 h-12 flex items-center justify-center font-bold">
                <span>{lang.toUpperCase() === 'FR' ? 'EN' : 'FR'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
