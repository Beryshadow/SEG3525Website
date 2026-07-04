import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Portfolio from './pages/Portfolio';
import VetPortal from './pages/uOPets';
import Design2 from './pages/MemoryGame';
import Design3 from './pages/Design3';
import Design4 from './pages/Design4';
import NeuroDeck from './pages/NeuroDeck';
import SerialRecall from './pages/SerialRecall';
import NotFound from './pages/NotFound';

export const ROUTE_CONFIG = [
  { path: '/', element: <Portfolio />},
  { path: '/uopets', element: <VetPortal />},
  { path: '/memorygame', element: <Design2 />},
  { path: '/vividly-minimal', element: <Design3 />},
  { path: '/aura-analytics', element: <Design4 />},
  { path: '/neurodeck', element: <NeuroDeck />},
  { path: '/serialrecall', element: <SerialRecall />},
  { path: '*', element: <NotFound />}
];

export default function AppRoutes() {
  return (
    <Routes>
      {ROUTE_CONFIG.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}
