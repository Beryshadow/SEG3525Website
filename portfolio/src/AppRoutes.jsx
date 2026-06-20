import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Portfolio from './pages/Portfolio';
import VetPortal from './pages/uOPets';
import Design2 from './pages/MemoryGame';
import Design3 from './pages/Design3';
import Design4 from './pages/Design4';
import NeuroDeck from './pages/NeuroDeck';
import SerialRecall from './pages/SerialRecall';

export const ROUTE_CONFIG = [
  { path: '/', element: <Portfolio />},
  { path: '/uopets', element: <VetPortal />},
  { path: '/memorygame', element: <Design2 />},
  { path: '/design3', element: <Design3 />},
  { path: '/design4', element: <Design4 />},
  { path: '/neurodeck', element: <NeuroDeck />},
  { path: '/serialrecall', element: <SerialRecall />}
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
