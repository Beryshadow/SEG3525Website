import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeckManager } from '../useDeckManager';

describe('useDeckManager Hook', () => {
  test('saves new deck to cache and updates deck list', () => {
    const showToast = vi.fn();
    const setMyDecks = vi.fn();
    const mockDeck = [
      { id: '1', question: 'Q1', choices: ['A', 'B'], correctAnswers: ['A'] }
    ];

    const { result } = renderHook(() => useDeckManager({
      myDecks: [],
      setMyDecks,
      currentDeck: mockDeck,
      setCurrentDeck: vi.fn(),
      loadedDeckId: null,
      setLoadedDeckId: vi.fn(),
      streak: 0,
      setStreak: vi.fn(),
      showToast,
      confirm: vi.fn(),
      t: {}
    }));

    act(() => {
      result.current.saveDeckToCache('Biology 101');
    });

    expect(setMyDecks).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalled();
  });

  test('deletes deck from cache', () => {
    const showToast = vi.fn();
    const setMyDecks = vi.fn();
    const confirm = vi.fn().mockImplementation(({ onConfirm }) => {
      if (onConfirm) onConfirm();
    });

    const { result } = renderHook(() => useDeckManager({
      myDecks: [{ id: 'd1', name: 'Test' }],
      setMyDecks,
      currentDeck: [],
      setCurrentDeck: vi.fn(),
      loadedDeckId: 'd1',
      setLoadedDeckId: vi.fn(),
      streak: 0,
      setStreak: vi.fn(),
      showToast,
      confirm,
      t: {}
    }));

    act(() => {
      result.current.deleteDeckFromCache('d1');
    });

    expect(confirm).toHaveBeenCalled();
  });
});
