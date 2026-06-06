import { useState, useEffect, useRef } from 'react';

export function useSharedLogic(sectionIds) {
  const [theme, setTheme] = useState(() => localStorage.getItem('portfolio-theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('portfolio-lang') || 'fr');
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mouseCoords = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const ticking = useRef(false);
  const lastScrollY = useRef(0);

  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const htmlElement = document.documentElement;
    theme === 'light' ? htmlElement.classList.add('light-mode') : htmlElement.classList.remove('light-mode');
    htmlElement.setAttribute('lang', lang);
    localStorage.setItem('portfolio-theme', theme);
    localStorage.setItem('portfolio-lang', lang);
  }, [theme, lang]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateShadows = () => {
      const widgets = document.querySelectorAll('.neu-panel, .neu-pressed, .neu-btn, .neu-card');
      const { x: mouseX, y: mouseY } = mouseCoords.current;

      widgets.forEach(widget => {
        const rect = widget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = mouseX - centerX;
        const distY = mouseY - centerY;

        let shadowX = Math.max(-18, Math.min(18, distX / -25));
        let shadowY = Math.max(-18, Math.min(18, distY / -25));
        let lightX = Math.max(-12, Math.min(12, distX / 35));
        let lightY = Math.max(-12, Math.min(12, distY / 35));
        let angleDeg = (Math.atan2(shadowY, shadowX) * (180 / Math.PI)) + 90;

        widget.style.setProperty('--shadow-x', `${shadowX}px`);
        widget.style.setProperty('--shadow-y', `${shadowY}px`);
        widget.style.setProperty('--light-x', `${lightX}px`);
        widget.style.setProperty('--light-y', `${lightY}px`);
        widget.style.setProperty('--grad-angle', `${angleDeg}deg`);
      });
      ticking.current = false;
    };

    const requestTick = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateShadows);
        ticking.current = true;
      }
    };

    const handleMouseMove = (e) => {
      mouseCoords.current = { x: e.clientX, y: e.clientY };
      requestTick();
    };

    const handleScroll = () => {
      requestTick();
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      if (isMobileMenuOpen && scrollDelta > 10) {
        setIsMobileMenuOpen(false);
      }
      lastScrollY.current = currentScrollY;

      let current = sectionIds[0];
      sectionIds.forEach(secId => {
        const el = document.getElementById(secId);
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 2) {
          current = secId;
        }
      });
      setActiveSection(current);
    };

    const handleGlobalClick = (e) => {
      if (!isMobileMenuOpen) return; 

      const menuEl = menuRef.current;
      const toggleEl = toggleRef.current;

      const clickedInsideMenu = menuEl && menuEl.contains(e.target);
      const clickedToggle = toggleEl && toggleEl.contains(e.target);
      const clickedNavLink = e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('.nav-link-btn');

      if ((clickedInsideMenu && clickedNavLink) || (!clickedInsideMenu && !clickedToggle)) {
        setIsMobileMenuOpen(false);
        
        if (menuEl && menuEl.classList.contains('show') && window.bootstrap?.Collapse) {
          const bsCollapse = window.bootstrap.Collapse.getInstance(menuEl);
          if (bsCollapse) bsCollapse.hide();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleGlobalClick);
    requestTick();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleGlobalClick);
    };
    
  }, [sectionIds, isMobileMenuOpen]); 

  const handleScrollToSection = (id) => {
    setIsMobileMenuOpen(false);

    const menuEl = menuRef.current;
    if (menuEl && menuEl.classList.contains('show') && window.bootstrap?.Collapse) {
      const bsCollapse = window.bootstrap.Collapse.getInstance(menuEl);
      if (bsCollapse) bsCollapse.hide();
    }

    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return { 
    theme, setTheme, 
    lang, setLang, 
    activeSection, 
    isMobileMenuOpen,
    menuRef,      
    toggleRef,    
    toggleMobileMenu: () => setIsMobileMenuOpen(prev => !prev),
    closeMobileMenu: () => setIsMobileMenuOpen(false),
    toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    toggleLang: () => setLang(l => l === 'fr' || l === 'FR' ? 'en' : 'fr'),
    handleScrollToSection
  };
}
