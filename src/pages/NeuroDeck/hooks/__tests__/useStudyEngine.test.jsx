import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  applyFocusModeFilter, 
  applyQuestionTypeFilter, 
  applyProportionalDeficit, 
  getSemanticallyPrioritizedCardIndex, 
  getDueCards,
  getCardWeaknessWeight,
  useStudyEngine
} from '../useStudyEngine';

describe('Study Engine Logic & Filtering', () => {
  test('applyFocusModeFilter filters cards by similarity threshold', () => {
    const deck = [
      { id: '1', question: 'Q1' },
      { id: '2', question: 'Q2' },
      { id: '3', question: 'Q3' }
    ];
    const embeddings = {
      '1': [1, 0, 0],
      '2': [0.9, 0, 0],
      '3': [0, 1, 0]
    };

    const result = applyFocusModeFilter(
      deck, 
      { active: true, focalNodeId: '1', mode: 'threshold', threshold: 0.8 }, 
      embeddings
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  test('applyQuestionTypeFilter filters by long, mcc, and multi question types', () => {
    const deck = [
      { id: '1', type: 'long' },
      { id: '2', type: 'mcq', choices: ['A', 'B', 'C'], correctAnswers: ['A', 'B'] },
      { id: '3', type: 'mcq', choices: ['A', 'B', 'C'], correctAnswers: ['A'] }
    ];

    const longOnly = applyQuestionTypeFilter(deck, { long: true, mcc: false, multi: false });
    expect(longOnly).toHaveLength(1);
    expect(longOnly[0].id).toBe('1');

    const mcqOnly = applyQuestionTypeFilter(deck, { long: false, mcc: true, multi: true });
    expect(mcqOnly).toHaveLength(2);
  });

  test('applyProportionalDeficit selects questions with highest attempt deficit', () => {
    const deck = [
      { id: '1', type: 'long', attempts: 0 },
      { id: '2', type: 'long', attempts: 0 },
      { id: '3', type: 'mcq', choices: ['A', 'B'], correctAnswers: ['A'], attempts: 10 }
    ];

    const result = applyProportionalDeficit(
      deck, 
      deck, 
      { long: true, mcc: true, multi: false, proportional: true }
    );

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('long');
  });

  test('getSemanticallyPrioritizedCardIndex identifies highest similarity weak cards', () => {
    const deck = [
      { id: '1', score: 2, attempts: 2, isMastered: false },
      { id: '2', score: 0, attempts: 0, isMastered: false },
      { id: '3', score: 0, attempts: 0, isMastered: false }
    ];
    const embeddings = {
      '1': [1, 0], 
      '2': [1, 0], 
      '3': [0, 1]  
    };
    const lowestCards = [deck[1], deck[2]];

    const idx = getSemanticallyPrioritizedCardIndex(deck, lowestCards, embeddings);
    expect(idx).toBe(1);
  });

  test('getCardWeaknessWeight ranks score 0 with 2 attempts higher than 1 attempt, and unattempted higher than 5/10', () => {
    const card2Attempts = { id: '1', score: 0, attempts: 2, isMastered: false };
    const card1Attempt = { id: '2', score: 0, attempts: 1, isMastered: false };
    const cardUnattempted = { id: '3', score: 0, attempts: 0, isMastered: false };
    const cardPartialMastery = { id: '4', score: 5, attempts: 3, isMastered: false };
    const cardMastered = { id: '5', score: 9, attempts: 5, isMastered: true };

    const w2 = getCardWeaknessWeight(card2Attempts);
    const w1 = getCardWeaknessWeight(card1Attempt);
    const wUn = getCardWeaknessWeight(cardUnattempted);
    const wPart = getCardWeaknessWeight(cardPartialMastery);
    const wMast = getCardWeaknessWeight(cardMastered);

    // Score 0 with 2 attempts > Score 0 with 1 attempt
    expect(w2).toBeGreaterThan(w1);
    // Score 0 with 1 attempt > Score 0 unattempted
    expect(w1).toBeGreaterThan(wUn);
    // Score 0 unattempted > Score 5/10 (mastery avoidance)
    expect(wUn).toBeGreaterThan(wPart);
    // Fully mastered = 0
    expect(wMast).toBe(0);
  });

  test('getDueCards returns cards scheduled for review', () => {
    const deck = [
      { id: '1', dueTurn: 0, isMastered: false },
      { id: '2', dueTurn: 5, isMastered: false },
      { id: '3', dueTurn: 0, isMastered: true }
    ];

    const due = getDueCards(deck, 2);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe('1');
  });
});

describe('useStudyEngine Hook Integration', () => {
  const mockDeck = [
    { id: '1', question: 'Q1', choices: ['A', 'B'], correctAnswers: ['A'], score: 0, attempts: 0 },
    { id: '2', question: 'Q2', choices: ['X', 'Y'], correctAnswers: ['X'], score: 0, attempts: 0 }
  ];

  test('provides next card selection and manual navigation', () => {
    const setMyDecks = vi.fn();
    const setCurrentDeck = vi.fn();
    const setCurrentIndex = vi.fn();

    const { result } = renderHook(() => useStudyEngine({
      myDecks: [],
      setMyDecks,
      currentDeck: mockDeck,
      setCurrentDeck,
      currentIndex: 0,
      setCurrentIndex,
      loadedDeckId: 'deck-1',
      cardEmbeddings: {},
      cardOrderMode: 'spaced',
      servingMode: 'full',
      focusMode: { active: false },
      questionTypeSettings: { long: true, mcc: true, multi: true, proportional: false },
      t: {},
      showToast: vi.fn()
    }));

    expect(typeof result.current.selectNextCard).toBe('function');
    expect(typeof result.current.handleManualNavigation).toBe('function');

    act(() => {
      result.current.handleManualNavigation(1);
    });

    expect(setCurrentIndex).toHaveBeenCalled();
  });
});
