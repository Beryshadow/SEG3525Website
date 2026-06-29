import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import ScrollToTop from './utilities/ScrollToTop';
import FaviconManager from './utilities/FaviconManager';

import AppRoutes from './AppRoutes';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <FaviconManager />
      <AppRoutes />
    </Router>
  );
}
