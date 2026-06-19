import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Portfolio from './pages/Portfolio';
import VetPortal from './pages/uOPets';
import Design2 from './pages/MemoryGame';
import Design3 from './pages/Design3';
import Design4 from './pages/Design4';
import NeuroDeck from './pages/NeuroDeck';
import SerialRecall from './pages/SerialRecall';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

function FaviconManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageName = pathname === '/' ? 'root' : pathname.replace('/', '');
    const links = document.querySelectorAll("link[rel*='icon']");

    links.forEach(link => {
      link.href = `${process.env.PUBLIC_URL}/favicon-${pageName}.ico`;
    });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <FaviconManager />

      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/uopets" element={<VetPortal />} />
        <Route path="/memorygame" element={<Design2 />} />
        <Route path="/design3" element={<Design3 />} />
        <Route path="/design4" element={<Design4 />} />
        <Route path="/neurodeck" element={<NeuroDeck />} />
        <Route path="/serialrecall" element={<SerialRecall />} />
      </Routes>
    </Router>
  );
}
