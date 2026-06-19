// My generic test
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import React from 'react';

window.scrollTo = jest.fn();

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'router-root' }, children),
    Routes: ({ children }) => React.createElement('div', { 'data-testid': 'routes-wrapper' }, children),
    Route: ({ path, element }) => React.createElement(
      'div', 
      { 'data-testid': `route-${path.replace('/', 'root')}` }, 
      element
    ),
    useLocation: () => ({ pathname: '/', hash: '' })
  };
}, { virtual: true });

const appFileContent = fs.readFileSync(
  path.resolve(__dirname, '../App.js'),
  'utf8'
);

const importLines = appFileContent.match(/import\s+(\w+)\s+from\s+['"]\.\/pages\/[^'"]+['"]/g) || [];

importLines.forEach((line) => {
  const componentName = line.match(/import\s+(\w+)/)[1];
  const importPath = line.match(/from\s+['"]\.(.*)['"]/)[1];
  
  jest.doMock(`..${importPath}`, () => {
    const React = require('react');
    return () => React.createElement(
      'div', 
      { 'data-testid': `mocked-${componentName}` }, 
      `${componentName} View`
    );
  }, { virtual: true });
});

const App = require('../App').default;

describe('Root Application Component', () => {
  test('automatically detects and dynamically renders the portfolio landing page route', () => {
    render(React.createElement(App));
    
    const portfolioView = screen.getByTestId('mocked-Portfolio');
    expect(portfolioView).toBeInTheDocument();
    expect(portfolioView).toHaveTextContent('Portfolio View');
  });
});
