import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function FaviconManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageName = pathname === '/' ? 'root' : pathname.replace('/', '');
    const links = document.querySelectorAll("link[rel*='icon']");

    links.forEach(link => {
      link.href = `/favicon-${pageName}.ico`;
    });
  }, [pathname]);

  return null;
}

export default FaviconManager;
