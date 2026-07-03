import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const isThemeClassAvailable = (themeName) => {
  if (!themeName || ['dark', 'light'].includes(themeName)) return true;

  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;

        for (const rule of Array.from(rules)) {
          if (rule.selectorText && rule.selectorText.includes(`.${themeName}`)) {
            return true;
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
};

export function useSharedLogic(sectionIds = []) {
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('portfolio-theme') || 'dark';
  });
  const [lang, setLang] = useState(() => localStorage.getItem('portfolio-lang') || 'fr');

  const [baseFallback, setBaseFallback] = useState(() => {
    const saved = localStorage.getItem('portfolio-base-fallback');
    if (saved) return saved;
    return ['dark', 'light'].includes(theme) ? theme : 'dark';
  });

  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mouseCoords = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const ticking = useRef(false);
  const lastScrollY = useRef(0);

  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    const isStandardTheme = ['dark', 'light'].includes(theme);
    const themeExistsInCSS = isThemeClassAvailable(theme);

    const isCustomThemeAllowedHere = location.pathname.includes('/memorygame');

    if (!isStandardTheme && (!isCustomThemeAllowedHere || !themeExistsInCSS)) {
      setTheme(baseFallback);
      return;
    }

    if (isStandardTheme) {
      setBaseFallback(theme);
      localStorage.setItem('portfolio-base-fallback', theme);
    }

    const isLightMode = theme === 'light' || theme === 'theme-rust-light';
    htmlElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
    htmlElement.setAttribute('lang', lang);

    const classesToRemove = Array.from(bodyElement.classList).filter(
      c => c.startsWith('theme-') || c === 'light-mode'
    );
    bodyElement.classList.remove(...classesToRemove);

    if (theme === 'light') {
      bodyElement.classList.add('light-mode');
    } else if (theme !== 'dark') {
      bodyElement.classList.add(theme);
    }

    localStorage.setItem('portfolio-theme', theme);
    localStorage.setItem('portfolio-lang', lang);
  }, [location.pathname, theme, lang, baseFallback]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    // CONFIGURATION
    const NEU_CONFIG = {
      selectors: '.neu-panel, .neu-pressed, .neu-btn, .neu-card',

      // Resting and target shadow limits
      shadows: {
        baseDarkX: 12, baseDarkY: 12,
        baseLightX: -8, baseLightY: -8,
        targetDarkLimit: -8, // Max distance the dark shadow moves when hovered
        targetLightLimit: 8, // Max distance the light shadow moves when hovered
      },

      // Scales shadows down for tiny elements
      scaling: {
        minScale: 0.55,
        maxScale: 1.0,
        refSize: 120, // Widget size (px) where shadows reach 100% scale
      },

      // How far away the mouse can affect a widget
      radius: {
        min: 200,
        max: 400,
        multiplier: 4.5, // Multiplied by widget size to get influence radius
      },

      // 3D Parallax physics
      tilt: {
        targetEdgeLift: 10, // Ideal pixels to lift the edge in 3D space
        maxAngleDeg: 6,     // Absolute maximum rotation limit for tiny elements
        perspective: 1000,   // Camera distance (lower = more fish-eye/dramatic)
      }
    };

    // MATH HELPERS
    const lerp = (start, end, factor) => start + (end - start) * factor;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    //  LOGIC EXTRACTORS
    // Calculates proximity, normalized mouse position, and scale for a single widget
    const getWidgetMetrics = (rect, mouseX, mouseY) => {
      const averageSize = Math.sqrt(rect.width * rect.height);
      const sizeScale = clamp(averageSize / NEU_CONFIG.scaling.refSize, NEU_CONFIG.scaling.minScale, NEU_CONFIG.scaling.maxScale);
      const maxInfluenceRadius = clamp(averageSize * NEU_CONFIG.radius.multiplier, NEU_CONFIG.radius.min, NEU_CONFIG.radius.max);

      const dx = Math.max(rect.left - mouseX, 0, mouseX - rect.right);
      const dy = Math.max(rect.top - mouseY, 0, mouseY - rect.bottom);
      const distanceToEdge = Math.sqrt(dx * dx + dy * dy);

      let proximity = Math.max(0, 1 - distanceToEdge / maxInfluenceRadius);
      proximity = proximity * proximity; // Ease curve

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // This guarantees the transition never overshoots your base shadows
      const normX = clamp((mouseX - centerX) / (rect.width / 2), -1, 1);
      const normY = clamp((mouseY - centerY) / (rect.height / 2), -1, 1);

      return {
        sizeScale,
        proximity,
        normX,
        normY,
        isHovering: distanceToEdge === 0,
        safeWidth: Math.max(1, rect.width / 2),
        safeHeight: Math.max(1, rect.height / 2)
      };
    };

    // Calculates the final CSS custom property variables for lighting
    const calculateShadows = (normX, normY, proximity, sizeScale) => {
      const c = NEU_CONFIG.shadows;

      const baseShadowX = c.baseDarkX * sizeScale;
      const baseShadowY = c.baseDarkY * sizeScale;
      const baseLightX = c.baseLightX * sizeScale;
      const baseLightY = c.baseLightY * sizeScale;

      const targetShadowX = normX * c.targetDarkLimit * sizeScale;
      const targetShadowY = normY * c.targetDarkLimit * sizeScale;
      const targetLightX = normX * c.targetLightLimit * sizeScale;
      const targetLightY = normY * c.targetLightLimit * sizeScale;

      return {
        x: lerp(baseShadowX, targetShadowX, proximity),
        y: lerp(baseShadowY, targetShadowY, proximity),
        lightX: lerp(baseLightX, targetLightX, proximity),
        lightY: lerp(baseLightY, targetLightY, proximity)
      };
    };

    // Calculates the 3D rotation angles safely
    const calculateTilt = (widget, isHovering, normX, normY, proximity, safeWidth, safeHeight) => {
      const isPanel = widget.classList.contains('neu-panel');
      const isPressed = widget.classList.contains('neu-pressed');
      const isChildOfCard = widget.closest('.neu-card') && widget.closest('.neu-card') !== widget;
      const isButton = widget.classList.contains('neu-btn');

      // Skip parallax for flat/pressed items, nested children, or actively hovered buttons
      if (isPanel || isPressed || isChildOfCard || (isButton && isHovering)) {
        return { rotateX: 0, rotateY: 0 };
      }

      const c = NEU_CONFIG.tilt;
      const maxAngleRad = c.maxAngleDeg * (Math.PI / 180);

      const allowedLiftX = Math.min(c.targetEdgeLift, safeHeight * Math.sin(maxAngleRad));
      const allowedLiftY = Math.min(c.targetEdgeLift, safeWidth * Math.sin(maxAngleRad));

      const maxTiltX = Math.asin(allowedLiftX / safeHeight) * (180 / Math.PI);
      const maxTiltY = Math.asin(allowedLiftY / safeWidth) * (180 / Math.PI);

      return {
        rotateX: normY * -maxTiltX * proximity,
        rotateY: normX * maxTiltY * proximity
      };
    };

    // MAIN LOOP 
    const updateShadows = () => {
      const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      const isMobileScreen = window.matchMedia("(max-width: 768px)").matches;

      // Kill the loop on mobile to save battery
      if (isTouchDevice || isMobileScreen) {
        ticking.current = false;
        return;
      }

      const widgets = document.querySelectorAll(NEU_CONFIG.selectors);
      const { x: mouseX, y: mouseY } = mouseCoords.current;

      widgets.forEach(widget => {
        const rect = widget.getBoundingClientRect();

        // 1. Extract dimensions and distances
        const metrics = getWidgetMetrics(rect, mouseX, mouseY);

        // 2. Get shadow and lighting outputs
        const shadows = calculateShadows(metrics.normX, metrics.normY, metrics.proximity, metrics.sizeScale);

        // 3. Get Parallax tilt outputs
        const tilt = calculateTilt(widget, metrics.isHovering, metrics.normX, metrics.normY, metrics.proximity, metrics.safeWidth, metrics.safeHeight);

        // 4. Apply to DOM
        widget.style.setProperty('--shadow-x', `${shadows.x}px`);
        widget.style.setProperty('--shadow-y', `${shadows.y}px`);
        widget.style.setProperty('--light-x', `${shadows.lightX}px`);
        widget.style.setProperty('--light-y', `${shadows.lightY}px`);

        if (tilt.rotateX === 0 && tilt.rotateY === 0) {
          widget.style.transform = 'none';
        } else {
          widget.style.transform = `perspective(${NEU_CONFIG.tilt.perspective}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`;
        }
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

      let current = activeSection;
      let closestDistance = Infinity;

      if (sectionIds && sectionIds.length > 0) {
        sectionIds.forEach(secId => {
          const el = document.getElementById(secId);
          if (el) {
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top - (window.innerHeight / 3));

            if (distance < closestDistance) {
              closestDistance = distance;
              current = secId;
            }
          }
        });
        setActiveSection(current);
      }
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
  }, [sectionIds, isMobileMenuOpen, activeSection, location.pathname]);

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
    theme,
    setTheme,
    appTheme: theme,
    setAppTheme: setTheme,
    lang,
    setLang,
    activeSection,
    isMobileMenuOpen,
    menuRef,
    toggleRef,
    toggleMobileMenu: () => setIsMobileMenuOpen(prev => !prev),
    closeMobileMenu: () => setIsMobileMenuOpen(false),
    toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
    toggleLang: () => setLang(l => l.toLowerCase() === 'fr' ? 'en' : 'fr'),
    handleScrollToSection
  };
}
