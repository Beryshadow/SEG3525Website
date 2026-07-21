import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAIEvaluation } from '../useAIEvaluation';

describe('useAIEvaluation Hook', () => {
  test('returns perfect score for exact matching single answer', async () => {
    const { result } = renderHook(() => useAIEvaluation({
      model: vi.fn(),
      modelStatus: 'ready',
      getEmbeddings: vi.fn(),
      t: {},
      currentLangKey: 'EN'
    }));

    const question = {
      id: 'q1',
      question: 'What is the capital of France?',
      choices: ['Paris', 'London', 'Berlin'],
      correctAnswers: ['Paris']
    };

    const res = await result.current.evaluateInput('Paris', question, ['Paris']);

    expect(res).toEqual({
      status: 'success',
      score: 10
    });
  });

  test('returns loading status when model is not ready', async () => {
    const { result } = renderHook(() => useAIEvaluation({
      model: null,
      modelStatus: 'loading',
      getEmbeddings: vi.fn(),
      t: {},
      currentLangKey: 'EN'
    }));

    const res = await result.current.evaluateInput('Some Non-Matching Text', { id: 'q1', choices: ['Other'] }, ['Correct Target']);
    expect(res).toEqual({ status: 'loading' });
  });

  test('evaluates conceptual similarity via embedding and NLI model', async () => {
    const mockGetEmbeddings = vi.fn().mockResolvedValue([
      [1.0, 0.0, 0.0], // user input
      [0.9, 0.0, 0.0], // truth
      [0.0, 1.0, 0.0], // distractor 1
      [0.0, 0.0, 1.0], // distractor 2
      [0.0, 0.5, 0.5]  // composite distractor
    ]);

    const mockNLIModel = vi.fn().mockImplementation((pairs) => {
      return Promise.resolve(pairs.map(p => {
        const str = typeof p === 'string' ? p : JSON.stringify(p);
        const isTruthPair = str.includes('Mitochondria');
        return [{ label: 'ENTAILMENT', score: isTruthPair ? 0.95 : 0.05 }];
      }));
    });

    const { result } = renderHook(() => useAIEvaluation({
      model: mockNLIModel,
      modelStatus: 'ready',
      getEmbeddings: mockGetEmbeddings,
      t: {},
      currentLangKey: 'EN'
    }));

    const question = {
      id: 'q2',
      question: 'What organelle produces ATP?',
      choices: ['Mitochondria', 'Nucleus', 'Ribosome'],
      correctAnswers: ['Mitochondria']
    };

    const res = await result.current.evaluateInput('Mitochondrion', question, ['Mitochondria']);

    expect(res.status).toBe('success');
    expect(res.score).toBeGreaterThanOrEqual(8);
  });
});
