import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import App from '../App';

window.scrollTo = vi.fn();

vi.mock('../utilities/ScrollToTop', () => ({
  default: () => null
}));

vi.mock('../pages/Portfolio', () => ({
  default: () => <div data-testid="mocked-Portfolio">Portfolio Component</div>
}));

vi.mock('../pages/NeuroDeck/index', () => ({
  default: () => <div data-testid="mocked-NeuroDeck">NeuroDeck Component</div>
}));

describe('App SPA Navigation', () => {
  test('renders top level app wrapper successfully', () => {
    render(<App />);
    const mockedPortfolio = screen.getByTestId('mocked-Portfolio');
    expect(mockedPortfolio).toBeInTheDocument();
  });
});
