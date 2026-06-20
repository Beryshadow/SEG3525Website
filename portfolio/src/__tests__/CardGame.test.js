import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { CardGame } from '../pages/gameFiles/CardGame';

jest.mock('../utilities/GameContext', () => ({
  useLocalStorage: (key, initialValue) => {
    let value = initialValue;
    return [value, (newValue) => { value = newValue; }];
  }
}));

const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CardGame Component', () => {
  const mockTranslations = {
    memoryTitle: "Test Game",
    memorySubtitle: "Test subtitle",
    memoryGridLabel: "Grille",
    memoryPairTypeLabel: "Type de Paire",
    memoryPairsOption: "Paires (2)",
    memoryTripletsOption: "Triplets (3)",
    memoryThemeLabel: "Thème",
    memoryThemeGestalt: "Principes Gestalt",
    memoryThemeMath: "Équations Mathématiques",
    memoryBtnRestart: "Recommencer",
    memoryFlipsLabel: "Coups",
    memoryMatchesLabel: "Correspondances",
    memoryEfficiencyLabel: "Efficacité",
    memoryHighScoreTitle: "Meilleurs Scores",
    memoryFlipsUnit: "coups",
    memoryAlertNewGame: "Nouveau jeu commencé !",
    memoryAlertFlip: "Carte retournée : ",
    memoryAlertMatchSuccess: "Excellente paire trouvée !",
    memoryAlertMatchFail: "Pas de correspondance.",
    memoryAlertWin: "Félicitations, vous avez gagné !",
    gestalt: {
      proximity: "Proximité",
      similarity: "Similitude",
      closure: "Clôture",
      continuity: "Continuité",
      figureGround: "Figure-Fond",
      symmetry: "Symétrie",
      commonFate: "Destin Commun",
      focalPoint: "Point Focal",
      simplicity: "Simplicité (Prägnanz)",
      commonRegion: "Région Commune",
      uniformConnectedness: "Connectivité Uniforme",
      parallelism: "Parallélisme",
      synchrony: "Synchronisme",
      pastExperience: "Expérience Passée",
      emergence: "Émergence",
      multistability: "Multistabilité",
      invariance: "Invariance",
      reification: "Réification"
    }
  };

  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Renderise la grille initiale de jeu (16 cartes par défaut)', () => {
    render(<CardGame t={mockTranslations} />);
    
    const cards = screen.getAllByRole('gridcell');
    expect(cards).toHaveLength(16);
  });

  test('Retourne une carte et enregistre un coup', () => {
    render(<CardGame t={mockTranslations} />);
    
    const cards = screen.getAllByRole('gridcell');
    
    expect(screen.getByText('Coups').nextSibling.textContent).toBe('0');
    
    fireEvent.click(cards[0]);
    
    expect(screen.getByText('Coups').nextSibling.textContent).toBe('1');
    expect(cards[0]).toHaveClass('is-flipped');
  });

  test('Empeche de cliquer sur plus de cartes que le matchType ne le permet', () => {
    render(<CardGame t={mockTranslations} />);
    
    const cards = screen.getAllByRole('gridcell');
    
    fireEvent.click(cards[0]);
    fireEvent.click(cards[1]);
    fireEvent.click(cards[2]);

    expect(screen.getByText('Coups').nextSibling.textContent).toBe('2');
  });
});
