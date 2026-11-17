import { describe, it, expect } from 'vitest';
import { reconcileProgressData } from '../helpers';

const card = (q, extra = {}) => ({ id: q, question: q, score: 0, attempts: 0, ...extra });
const deck = (id, name, cards) => ({ id, name, deck: cards, completed: false, parentId: null });

describe('reconcileProgressData — currentDeck across devices (sync-merge bug regression)', () => {
  it('does NOT union different decks: cloud snapshot wins when devices hold different current decks', () => {
    // Repro of the live bug: receiver on the 196-card default (no deck loaded),
    // sender pushes a 3-card custom deck (loadedDeckId set). Old behavior
    // produced a 199-card hybrid; correct behavior mirrors the cloud state.
    const localDefault = Array.from({ length: 196 }, (_, i) => card(`default-q${i}`));
    const cloudCustom = [card('c1'), card('c2'), card('c3')];
    const cloudDeck = deck('d1', 'Custom', cloudCustom);

    const result = reconcileProgressData(
      { myDecks: [], currentDeck: localDefault, loadedDeckId: null, streak: 0 },
      { myDecks: [cloudDeck], currentDeck: cloudCustom, loadedDeckId: 'd1', streak: 2 }
    );

    expect(result.currentDeck).toHaveLength(3);
    expect(result.currentDeck.map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(result.loadedDeckId).toBe('d1');
    // saved decks still merge (nothing lost)
    expect(result.myDecks.map(d => d.id)).toEqual(['d1']);
  });

  it('unions per-card progress when both devices work the SAME loaded deck', () => {
    const local = [card('q1', { score: 4, attempts: 2 }), card('q2')];
    const cloud = [card('q1', { score: 8, attempts: 1 }), card('q3', { score: 5, attempts: 3 })];

    const result = reconcileProgressData(
      { myDecks: [], currentDeck: local, loadedDeckId: 'd1', streak: 1 },
      { myDecks: [], currentDeck: cloud, loadedDeckId: 'd1', streak: 3 }
    );

    expect(result.currentDeck.map(c => c.id).sort()).toEqual(['q1', 'q2', 'q3']);
    const q1 = result.currentDeck.find(c => c.id === 'q1');
    expect(q1.score).toBe(8); // max of both sides
    expect(q1.attempts).toBe(2);
    expect(result.streak).toBe(3);
  });

  it('unions the default deck studied on two devices (both unloaded, high overlap)', () => {
    const a = Array.from({ length: 100 }, (_, i) => card(`q${i}`));
    const b = a.map(c => ({ ...c, score: 10 }));

    const result = reconcileProgressData(
      { myDecks: [], currentDeck: a, loadedDeckId: null, streak: 0 },
      { myDecks: [], currentDeck: b, loadedDeckId: null, streak: 0 }
    );

    expect(result.currentDeck).toHaveLength(100);
    expect(result.currentDeck.every(c => c.score === 10)).toBe(true);
  });

  it('falls back to the local deck when cloud has no usable currentDeck array', () => {
    const local = [card('q1')];
    const result = reconcileProgressData(
      { myDecks: [], currentDeck: local, loadedDeckId: null, streak: 0 },
      { myDecks: [], currentDeck: undefined, loadedDeckId: 'd9', streak: 0 }
    );
    expect(result.currentDeck).toEqual(local);
  });

  it('does NOT let an unloaded cloud state overwrite a LOADED local workbench (mount-broadcast guard)', () => {
    // A freshly mounted device on the fallback default deck broadcasts
    // {default deck, no deck loaded}; a device actively studying a loaded
    // deck must not be yanked off it by that junk push.
    const localCustom = [card('c1'), card('c2')];
    const cloudDefault = Array.from({ length: 196 }, (_, i) => card(`default-q${i}`));

    const result = reconcileProgressData(
      { myDecks: [], currentDeck: localCustom, loadedDeckId: 'd1', streak: 0 },
      { myDecks: [], currentDeck: cloudDefault, loadedDeckId: null, streak: 0 }
    );

    expect(result.currentDeck).toEqual(localCustom);
    expect(result.loadedDeckId).toBe('d1');
  });

  it('keeps an EMPTY current deck empty (empty-deck load must not resurrect the default deck)', () => {
    const result = reconcileProgressData(
      { myDecks: [deck('d1', 'Empty', [])], currentDeck: [], loadedDeckId: 'd1', streak: 0 },
      { myDecks: [deck('d1', 'Empty', [])], currentDeck: [], loadedDeckId: 'd1', streak: 0 }
    );
    expect(result.currentDeck).toEqual([]);
  });
});
