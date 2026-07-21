import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { CardGame } from '../pages/gameFiles/CardGame';

vi.mock('../utilities/GameContext', () => ({
  useLocalStorage: (key, initialValue) => [initialValue, vi.fn()]
}));

const mockTranslations = {
  memoryTitle: "Test Game",
  memorySubtitle: "Test subtitle",
  matchTypeLabel: "Type de match",
  gridSizeLabel: "Taille de grille",
  modeEquationsLabel: "Équations",
  modeWordImagesLabel: "Mots/Images",
  cardSetsLabel: "Jeux de cartes",
  recommencer: "Recommencer",
  efficiencyLabel: "Efficacité",
  flipsLabel: "Coups",
  bravo: "Bravo !",
  victoireDesc: "Victoire"
};

describe('CardGame Memory Component', () => {
  test('renders memory game initial grid', () => {
    render(<CardGame t={mockTranslations} />);
    expect(screen.getByText("Test Game")).toBeInTheDocument();
  });
});
