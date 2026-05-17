const widgets = document.querySelectorAll('.neu-panel, .neu-pressed, .neu-btn, .neu-card');

let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;

let ticking = false;

function updateShadows() {
    widgets.forEach(widget => {
        const rect = widget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distX = lastMouseX - centerX;
        const distY = lastMouseY - centerY;
        
        let shadowX = Math.max(-18, Math.min(18, distX / -25));
        let shadowY = Math.max(-18, Math.min(18, distY / -25));
        let lightX = Math.max(-12, Math.min(12, distX / 35));
        let lightY = Math.max(-12, Math.min(12, distY / 35));
        
        let angleRad = Math.atan2(shadowY, shadowX);
        let angleDeg = (angleRad * (180 / Math.PI)) + 90; 
        
        widget.style.setProperty('--shadow-x', `${shadowX}px`);
        widget.style.setProperty('--shadow-y', `${shadowY}px`);
        widget.style.setProperty('--light-x', `${lightX}px`);
        widget.style.setProperty('--light-y', `${lightY}px`);
        
        widget.style.setProperty('--grad-angle', `${angleDeg}deg`);
    });
    
    ticking = false;
}

function requestTick() {
  if (!ticking) {
    requestAnimationFrame(updateShadows);
    ticking = true;
  }
}

document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  requestTick();
});

window.addEventListener('scroll', () => {
  requestTick();
}, { passive: true });


document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    document.querySelectorAll('.theme-icon-sun').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.theme-icon-moon').forEach(el => el.style.display = 'block');
  }

  const savedLang = localStorage.getItem('portfolio-lang');
  if (savedLang) {
    document.documentElement.setAttribute('lang', savedLang);
  }

  const sections = ['hero', 'about', 'method', 'projects'];
  const navItems = document.querySelectorAll('.nav-item');

  function updateActiveNav() {
    let current = '';
    sections.forEach(secId => {
      const el = document.getElementById(secId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2) {
          current = secId;
        }
      }
    });

    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-target') === current) {
        item.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();
});

function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('light-mode');
  const isLight = html.classList.contains('light-mode');

  localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');

  document.querySelectorAll('.theme-icon-sun').forEach(el => el.style.display = isLight ? 'none' : 'block');
  document.querySelectorAll('.theme-icon-moon').forEach(el => el.style.display = isLight ? 'block' : 'none');
}

function toggleLang() {
  const html = document.documentElement;
  const currentLang = html.getAttribute('lang');
  const newLang = currentLang === 'fr' ? 'en' : 'fr';

  html.setAttribute('lang', newLang);
  localStorage.setItem('portfolio-lang', newLang);
}

document.addEventListener('click', (event) => {
  const menu = document.getElementById('mobileNav');
  if (menu && menu.classList.contains('show')) {
    bootstrap.Collapse.getInstance(menu).hide();
  }
});
