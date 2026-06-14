import { Link } from 'react-router-dom';
import { useSharedLogic } from '../shared';
import { TRANSLATIONS } from '../data/portfolioData';
import '../App.css';
import '../Vet.css';
import '../Games.css';
import '../Flashcard.css';

export default function Portfolio() {
  const {
    theme, lang, activeSection,
    isMobileMenuOpen, menuRef, toggleRef, toggleMobileMenu, closeMobileMenu,
    toggleTheme, toggleLang, handleScrollToSection
  } = useSharedLogic(['hero', 'about', 'method', 'projects']);

  const t = TRANSLATIONS[lang];

  const navItems = [
    { id: 'hero', icon: 'fa-home', label: t.navHome },
    { id: 'about', icon: 'fa-user', label: t.navAbout },
    { id: 'method', icon: 'fa-flask', label: t.navMethod },
    { id: 'projects', icon: 'fa-folder-tree', label: t.navProjects }
  ];

  return (
    <div className="font-sans antialiased overflow-clip">

      {/* Mobile Navigation */}
      <nav className="navbar navbar-dark d-lg-none sticky-top z-50 w-full px-4 pt-4 mb-8">
        <div className="neu-panel w-100 px-4 py-3 d-flex justify-content-between align-items-center">
          <a className="font-bold tracking-wider text-accent" href="#hero">RYAN BELAND</a>

          <div className="d-flex align-items-center gap-2">
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
          <div ref={menuRef} className="mt-2 w-full px-2">
            <div className="neu-pressed p-4 w-full">
              <ul className="navbar-nav gap-3">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      className="nav-link-btn d-flex align-items-center gap-3 w-100 text-left"
                      onClick={() => {
                        handleScrollToSection(item.id);
                        closeMobileMenu();
                      }}
                    >
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
                <span className="text-xs text-textMuted uppercase tracking-widest">Portfolio</span>
              </div>

              <nav className="flex flex-col gap-4" id="left-nav">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleScrollToSection(item.id)}
                    className={`neu-btn p-4 flex items-center gap-4 text-sm font-bold nav-item text-left w-full ${activeSection === item.id ? 'active' : ''}`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center`}></i>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="col-lg-9">

            {/* Hero */}
            <header id="hero" className="min-h-screen flex items-center mb-24">
              <div className="row align-items-center w-100 g-5">
                <div className="col-lg-8 order-2 order-lg-1 px-8">
                  <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
                    <span>{t.heroGreeting} <br /><span className="text-accent">Ryan Beland</span>.</span>
                  </h1>
                  <p className="text-xl max-w-2xl text-textMain mb-8">
                    <span>{t.heroSub}</span>
                  </p>
                  <a href="#projects" className="neu-btn inline-block px-8 py-4 font-bold tracking-wide">
                    <span>{t.heroBtn}</span>
                  </a>
                </div>
                <div className="col-lg-4 order-1 order-lg-2 d-flex justify-content-center justify-content-lg-end">
                  <a href="https://ryanbeland.dev/" className="neu-card p-3 block cursor-pointer" style={{ borderRadius: '9999px' }}>
                    <img src="image.jpg" alt="See my old portfolio" className="w-56 h-56 rounded-full object-cover" />
                  </a>
                </div>
              </div>
            </header>

            {/* About */}
            <section id="about" className="mb-32">
              <h2 className="text-3xl font-bold mb-10 text-accent text-center text-lg-start lg:ml-2">
                <span>{t.aboutTitle}</span>
              </h2>
              <div className="row g-5">
                <div className="col-lg-7">
                  <div className="neu-panel p-8 h-100">
                    <p className="text-lg">{t.aboutP1}</p>
                    <p className="text-lg mt-4">{t.aboutP2}</p>
                    <p className="text-lg mt-4 mb-0">{t.aboutP3}</p>
                  </div>
                </div>
                <div className="col-lg-5">
                  <div className="neu-pressed p-8 h-100">
                    <h3 className="text-xl font-bold mb-6 text-accent">
                      <i className="fas fa-code mr-2"></i>
                      <span>{t.skillsTitle}</span>
                    </h3>
                    <div className="flex flex-col gap-4">
                      <a href="https://nixos.org/" target="_blank" rel="noreferrer" className="neu-btn px-5 py-3 text-sm font-semibold flex justify-between items-center">
                        NixOS <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                      <a href="https://www.rust-lang.org/" target="_blank" rel="noreferrer" className="neu-btn px-5 py-3 text-sm font-semibold flex justify-between items-center">
                        Rust <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                      <a href="https://www.netacad.com/courses/cybersecurity" target="_blank" rel="noreferrer" className="neu-btn px-5 py-3 text-sm font-semibold flex justify-between items-center">
                        <span>{t.skillsCyber}</span>
                        <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                      <a href="https://github.com/awesome-selfhosted/awesome-selfhosted" target="_blank" rel="noreferrer" className="neu-btn px-5 py-3 text-sm font-semibold flex justify-between items-center">
                        <span>{t.skillsServers}</span>
                        <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                      <a href="https://catalogue.uottawa.ca/en/undergrad/minor-psychology" target="_blank" rel="noreferrer" className="neu-btn px-5 py-3 text-sm font-semibold flex justify-between items-center">
                        <span>{t.skillsPsych}</span>
                        <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                      <a href="https://affinity.serif.com/en-us/designer" target="_blank" rel="noreferrer" className="neu-btn px-5 py-3 text-sm font-semibold flex justify-between items-center">
                        <span>{t.skillsDesign}</span>
                        <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Methodology */}
            <section id="method" className="mb-32">
              <h2 className="text-3xl font-bold mb-10 text-accent text-center text-lg-start lg:ml-2">
                <span>{t.methodTitle}</span>
              </h2>
              <div className="row g-5">
                <div className="col-lg-6">
                  <div className="neu-panel p-8">
                    <p className="text-lg">{t.methodP1}</p>
                    <p className="text-lg">
                      {t.methodP2.split(/(SEG3525|Université d'Ottawa|University of Ottawa|NN\/g)/g).map((part, index) => {
                        if (part === 'SEG3525') {
                          return (
                            <a key={index} href="https://catalogue.uottawa.ca/en/courses/seg/#:~:text=SEG%203525" target="_blank" rel="noreferrer" className="text-accent font-semibold">
                              {part}
                            </a>
                          );
                        }
                        if (part === "Université d'Ottawa" || part === "University of Ottawa") {
                          return (
                            <a key={index} href="https://www.uottawa.ca/" target="_blank" rel="noreferrer" className="text-accent font-semibold">
                              {part}
                            </a>
                          );
                        }
                        if (part === 'NN/g') {
                          return (
                            <a key={index} href="https://www.nngroup.com/" target="_blank" rel="noreferrer" className="text-accent font-semibold">
                              {part}
                            </a>
                          );
                        }
                        return part;
                      })}
                    </p>
                    <div className="neu-pressed p-5 mt-6">
                      <p className="text-sm italic text-textMuted mb-0 leading-relaxed">{t.methodNote}</p>
                    </div>
                    <p className="text-lg mt-4">{t.methodP3}</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="flex flex-col gap-5">
                    <a href="https://www.designcouncil.org.uk/resources/the-double-diamond/" target="_blank" rel="noreferrer" className="neu-card neu-pressed p-5 block">
                      <h5 className="font-bold text-xl text-accent mb-2">{t.step1Title}</h5>
                      <p className="text-lg text-textMain mb-0">{t.step1Text}</p>
                      <br />
                      <h5 className="font-bold text-xl text-accent mb-2">{t.step2Title}</h5>
                      <p className="text-lg text-textMain mb-0">{t.step2Text}</p>
                      <br />
                      <h5 className="font-bold text-xl text-accent mb-2">{t.step3Title}</h5>
                      <p className="text-lg text-textMain mb-0">{t.step3Text}</p>
                      <br />
                      <h5 className="font-bold text-xl text-accent mb-2">{t.step4Title}</h5>
                      <p className="text-lg text-textMain mb-0">{t.step4Text}</p>
                      <br />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <i className="fas fa-external-link-alt text-s opacity-50"></i>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            
            {/* Projects */}
            <section id="projects" className="mb-16">
              <div className="text-center text-lg-start mb-10 lg:ml-2">
                <h2 className="text-3xl font-bold text-accent mb-2">{t.casesTitle}</h2>
                <p className="text-textMuted">{t.casesSub}</p>
              </div>

              <div className="row row-cols-1 row-cols-md-2 g-5">
                <div className="col">
                  <Link to="/devoir2" className="neu-card block p-6 h-100 group">
                    <div className={`${theme === 'light' ? 'light-mode' : ''} vet-route neu-pressed h-40 flex items-center justify-center mb-6`}>
                      <i
                        className="fas fa-paw fa-3x opacity-80 group-hover:scale-110 transition-transform duration-500"
                        style={{ color: 'var(--accent)' }}
                      ></i>
                    </div>
                    <h5 className="font-bold text-lg text-[var(--text-main)] mb-3">
                      <span>{t.project1Title}</span>
                    </h5>
                    <p className="text-sm text-textMain mb-4">
                      <span>{t.project1Text}</span>
                    </p>
                  </Link>
                </div>

                <div className="col">
                  <Link to="/design2" className="neu-card block p-6 h-100 group">
                    <div className={`${theme === 'light' ? 'light-mode' : ''} game-route neu-pressed h-40 flex items-center justify-center mb-6`}>
                      <i
                        className="fas fa-brain fa-3x opacity-80 group-hover:scale-110 transition-transform duration-500"
                        style={{ color: 'var(--accent)' }}
                      ></i>
                    </div>
                    <h5 className="font-bold text-lg text-[var(--text-main)] mb-3">
                      <span>{t.project2Title}</span>
                    </h5>
                    <p className="text-sm text-textMain mb-4">
                      <span>{t.project2Text}</span>
                    </p>
                  </Link>
                </div>

                <div className="col">
                  <Link to="/design3" className="neu-card block p-6 h-100 group">
                    <div className="neu-pressed h-40 flex items-center justify-center mb-6">
                      <i className="fas fa-store fa-3x text-accent opacity-80 group-hover:scale-110 transition-transform duration-500"></i>
                    </div>
                    <h5 className="font-bold text-lg text-[var(--text-main)] mb-3">
                      <span>{t.project3Title}</span>
                    </h5>
                    <p className="text-sm text-textMain mb-4">
                      <span>{t.project3Text}</span>
                    </p>
                    <div className="neu-panel px-4 py-2 text-xs text-textMuted font-bold uppercase tracking-wider d-inline-block border-0">
                      <span>{t.comingSoon}</span>
                    </div>
                  </Link>
                </div>

                <div className="col">
                  <Link to="/design4" className="neu-card block p-6 h-100 group">
                    <div className="neu-pressed h-40 flex items-center justify-center mb-6">
                      <i className="fas fa-mountain fa-3x text-accent opacity-80 group-hover:scale-110 transition-transform duration-500"></i>
                    </div>
                    <h5 className="font-bold text-lg text-[var(--text-main)] mb-3">
                      <span>{t.project4Title}</span>
                    </h5>
                    <p className="text-sm text-textMain mb-4">
                      <span>{t.project4Text}</span>
                    </p>
                    <div className="neu-panel px-4 py-2 text-xs text-textMuted font-bold uppercase tracking-wider d-inline-block border-0">
                      <span>{t.comingSoon}</span>
                    </div>
                  </Link>
                </div>

                <div className="col">
                  <Link to="/flashcard" className="neu-card block p-6 h-100 group">
                    <div className={`${theme === 'light' ? 'light-mode' : ''} flashcard-route neu-pressed h-40 flex items-center justify-center mb-6`}>
                      <i
                        className="fas fa-floppy-disk fa-3x opacity-80 group-hover:scale-110 transition-transform duration-500"
                        style={{ color: 'var(--accent)' }}
                      ></i>
                    </div>
                    <h5 className="font-bold text-lg text-[var(--text-main)] mb-3">
                      <span>{t.flashcardTitle}</span>
                    </h5>
                    <p className="text-sm text-textMain mb-4">
                      <span>{t.flashcardText}</span>
                    </p>
                  </Link>
                </div>

              </div>
            </section>

            <footer className="pt-8 pb-4 mt-16 text-center lg:text-left">
              <div className="neu-pressed p-6 d-flex flex-column flex-lg-row justify-content-between align-items-center">
                <div>
                  <h3 className="font-bold text-lg text-accent mb-1">Ryan Beland</h3>
                  <p className="text-sm text-textMuted mb-0">
                    <span>{t.footerCourse}</span>
                  </p>
                </div>
                <p className="text-sm text-textMuted mt-4 mt-lg-0 mb-0">&copy; 2026 Université d'Ottawa / University of Ottawa.</p>
              </div>
            </footer>

          </div>

          {/* Utility Panel */}
          <div className="col-lg-1 d-none d-lg-block">
            <div className="sticky top-12 flex flex-col items-center gap-4">
              <button onClick={toggleTheme} className="neu-btn w-12 h-12 flex items-center justify-center" title="Toggle Theme">
                <i className="fas fa-sun theme-icon-sun text-lg" style={{ display: theme === 'dark' ? 'block' : 'none' }}></i>
                <i className="fas fa-moon theme-icon-moon text-lg" style={{ display: theme === 'light' ? 'block' : 'none' }}></i>
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
  );
}
