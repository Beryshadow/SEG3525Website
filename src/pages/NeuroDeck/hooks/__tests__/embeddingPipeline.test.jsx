import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { useState, useEffect } from 'react';

// Unit test simulating the extraction loop logic with 525 cards
describe('Embedding Extraction Loop Test', () => {
  test('processes all 525 cards in streaming batches without freezing at 0', async () => {
    const totalCards = 525;
    const currentDeck = Array.from({ length: totalCards }, (_, i) => ({
      id: `q_${i}`,
      question: `Question text for card ${i}`
    }));

    const mockGetEmbeddings = vi.fn().mockImplementation(async (texts) => {
      // Simulate WebWorker processing time per batch
      await new Promise(r => setTimeout(r, 10));
      return texts.map(() => [0.1, 0.2, 0.3]);
    });

    const useExtractionSimulator = () => {
      const [cardEmbeddings, setCardEmbeddings] = useState({});

      useEffect(() => {
        if (!currentDeck || !mockGetEmbeddings) return;

        const missing = currentDeck.filter(q => cardEmbeddings[q.id] === undefined);
        if (missing.length === 0) return;

        let isCancelled = false;

        const processBatch = async () => {
           const chunkSize = 50;
           let queue = [...missing];

           while (queue.length > 0 && !isCancelled) {
              const chunk = queue.slice(0, chunkSize);
              const texts = chunk.map(q => q.question);

              try {
                 const res = await mockGetEmbeddings(texts);
                 if (isCancelled) break;

                 setCardEmbeddings(prev => {
                    const next = { ...prev };
                    for (let i = 0; i < chunk.length; i++) {
                       next[chunk[i].id] = (res && res[i]) ? res[i] : [];
                    }
                    return next;
                 });
              } catch (err) {
                 if (isCancelled) break;
              }

              queue = queue.slice(chunkSize);
           }
        };

        processBatch();

        return () => {
           isCancelled = true;
        };
      }, [currentDeck, cardEmbeddings]);

      return { cardEmbeddings };
    };

    const { result } = renderHook(() => useExtractionSimulator());

    // Allow async batch loop to run through all 525 cards
    await act(async () => {
      await new Promise(r => setTimeout(r, 300));
    });

    const embeddedCount = Object.keys(result.current.cardEmbeddings).length;
    expect(embeddedCount).toBe(525);
    expect(mockGetEmbeddings).toHaveBeenCalled();
  });
});
