import { cosineSimilarity } from '../../../utilities/shared';

const embeddingCache = new Map();

export const useAIEvaluation = ({ model, getEmbeddings, t, currentLangKey }) => {

  const getEntailmentScores = (output) => {
    const classes = Array.isArray(output) && Array.isArray(output[0]) ? output[0] : (Array.isArray(output) ? output : [output]);
    if (!classes || classes.length === 0 || !classes[0].label) {
      return { entailment: 0, isEntailment: false, isContradiction: false };
    }
    
    let entailmentScore = 0;
    let topLabel = "";
    let maxScore = -1;

    for (const c of classes) {
      if (!c) continue;
      const labelStr = (c.label ? String(c.label) : "").toUpperCase();
      if (c.score > maxScore) {
        maxScore = c.score;
        topLabel = labelStr;
      }
      if (labelStr.includes('ENTAIL') || labelStr === 'LABEL_1' || labelStr === 'LABEL_0') {
         if (labelStr.includes('ENTAIL')) {
             entailmentScore = c.score;
         } else if (entailmentScore === 0) {
             entailmentScore = c.score; 
         }
      }
    }
    
    const isEntailment = topLabel.includes('ENTAIL') || topLabel === 'LABEL_1' || topLabel === 'LABEL_0';
    const isContradiction = topLabel.includes('CONTRADICTION') || topLabel === 'LABEL_2';
    return { entailment: entailmentScore, isEntailment, isContradiction };
  };

  const evaluateInput = async (userInput, question, correctAnswersArray) => {
    if (!userInput.trim()) return null;
    
    const cleanInput = userInput.trim().toLowerCase();
    const isPerfectSingleAnswer = correctAnswersArray.length === 1 && cleanInput === correctAnswersArray[0].trim().toLowerCase();
    
    if (isPerfectSingleAnswer) {
        return { status: "success", score: 10.0 };
    }

    if (!model) {
      return { status: "loading" };
    }

    const truthTexts = correctAnswersArray;
    const choicesArray = Array.isArray(question?.choices) ? question.choices : [];
    const incorrectTexts = choicesArray.filter(c => !correctAnswersArray.includes(c));
    const validTruths = truthTexts.filter(t => t.trim());
    const compositeDistractor = incorrectTexts.join(". ");
    const distractorField = [...incorrectTexts, compositeDistractor].filter(d => d.trim());

    // --- 1. FAST EMBEDDING PRE-CHECK (~30ms) ---
    let maxEmbeddingSim = 0;
    let maxDistractorEmbSim = 0;

    if (getEmbeddings && validTruths.length > 0) {
      try {
         const userText = userInput.trim();
         const uncached = [];

         if (!embeddingCache.has(userText)) uncached.push(userText);
         for (const truth of validTruths) {
           const key = truth.trim();
           if (!embeddingCache.has(key)) uncached.push(key);
         }
         for (const dist of distractorField) {
           const key = dist.trim();
           if (!embeddingCache.has(key)) uncached.push(key);
         }

         if (uncached.length > 0) {
           const computed = await getEmbeddings(uncached);
           if (computed && computed.length === uncached.length) {
             uncached.forEach((txt, idx) => {
               if (embeddingCache.size > 500) {
                 const firstKey = embeddingCache.keys().next().value;
                 embeddingCache.delete(firstKey);
               }
               embeddingCache.set(txt, computed[idx]);
             });
           }
         }

         const inputEmb = embeddingCache.get(userText);
         if (inputEmb) {
           for (const truth of validTruths) {
             const truthEmb = embeddingCache.get(truth.trim());
             if (truthEmb) {
               const sim = cosineSimilarity(inputEmb, truthEmb);
               if (sim > maxEmbeddingSim) maxEmbeddingSim = sim;
             }
           }
           for (const dist of distractorField) {
             const distEmb = embeddingCache.get(dist.trim());
             if (distEmb) {
               const sim = cosineSimilarity(inputEmb, distEmb);
               if (sim > maxDistractorEmbSim) maxDistractorEmbSim = sim;
             }
           }
         }
      } catch (e) {
         console.error("Embedding fast-path failed", e);
      }
    }

    // Fast-path success: if high similarity to truth (> 0.85) and beats distractors
    if (maxEmbeddingSim >= 0.85 && maxEmbeddingSim > maxDistractorEmbSim + 0.05) {
      return { status: "success", score: Math.min(10.0, Math.max(8.0, maxEmbeddingSim * 10)), hotColdScore: maxEmbeddingSim };
    }

    // Fast-path wrong: if extremely low similarity (< 0.20) to everything
    if (maxEmbeddingSim <= 0.20 && maxDistractorEmbSim <= 0.20) {
      return { status: "wrong", score: 0.0, hotColdScore: maxEmbeddingSim };
    }

    if (!model) {
      // Fallback if NLI model is still loading
      if (maxEmbeddingSim >= 0.70) {
        return { status: "success", score: Math.min(10.0, maxEmbeddingSim * 10), hotColdScore: maxEmbeddingSim };
      }
      return { status: "wrong", score: 0.0, hotColdScore: maxEmbeddingSim };
    }

    // --- 2. STREAMLINED FORWARD NLI EVALUATION FOR BORDERLINE CASES ---
    try {
      const sepToken = model?.tokenizer?.sep_token || "[SEP]";
      const questionContext = currentLangKey === 'FR' ? `Question: ${question.question} Réponse:` : `Question: ${question.question} Answer:`;
      const statementUser = `${questionContext} ${userInput.trim()}`;

      const pairsToEvaluate = [];
      const mapping = []; 

      let hits = 0;
      let totalEntailment = 0;

      for (const dist of distractorField) {
        const statementChoice = `${questionContext} ${dist.trim()}`;
        pairsToEvaluate.push(`${statementUser} ${sepToken} ${statementChoice}`);
        mapping.push({ type: 'distractor', text: dist });
      }

      for (const truth of validTruths) {
        const cleanTruth = truth.trim().toLowerCase();
        if (cleanInput === cleanTruth) {
          totalEntailment += 1.0;
          hits++;
          continue; 
        }
        const statementChoice = `${questionContext} ${truth.trim()}`;
        pairsToEvaluate.push(`${statementUser} ${sepToken} ${statementChoice}`);
        mapping.push({ type: 'truth', text: truth });
      }

      let maxDistractorScore = maxDistractorEmbSim;
      let closestIncorrectText = null;
      let isStrongContradiction = false;

      if (pairsToEvaluate.length > 0) {
        const batchedOutputs = await model(pairsToEvaluate, { top_k: 5, topk: 5 });
        const normalizedOutputs = Array.isArray(batchedOutputs) && batchedOutputs.length > 0 && !Array.isArray(batchedOutputs[0])
            ? [batchedOutputs]
            : batchedOutputs;

        for (let i = 0; i < normalizedOutputs.length; i++) {
          const map = mapping[i];
          const out = normalizedOutputs[i];
          const scores = getEntailmentScores(out);
          
          if (map.type === 'distractor') {
             if (scores.entailment > maxDistractorScore) {
                maxDistractorScore = scores.entailment;
                closestIncorrectText = map.text === compositeDistractor ? "Composite Distractor" : map.text;
             }
          } else if (map.type === 'truth') {
             if (scores.isContradiction) {
                isStrongContradiction = true;
             }
             totalEntailment += scores.entailment;
             if (scores.entailment > maxDistractorScore && scores.isEntailment) {
                hits++;
             }
          }
        }
      }

      const avgEntailment = validTruths.length > 0 ? totalEntailment / validTruths.length : 0;
      let effectiveTruthScore = avgEntailment;
      
      if (maxEmbeddingSim >= 0.80 && !isStrongContradiction) {
         effectiveTruthScore = Math.max(avgEntailment, maxEmbeddingSim);
         if (hits === 0 && effectiveTruthScore > maxDistractorScore) {
             hits = 1;
         }
      }

      let mappedScore10 = 0;
      if (hits === validTruths.length && validTruths.length > 0) {
          mappedScore10 = 5 + ((effectiveTruthScore - maxDistractorScore) / Math.max(0.01, 1 - maxDistractorScore)) * 5;
          if (effectiveTruthScore >= 0.85) mappedScore10 = 10.0;
      } else if (hits > 0) {
          const hitRatio = hits / validTruths.length;
          mappedScore10 = hitRatio * 4.9;
      } else {
          const ratio = maxDistractorScore > 0 ? (effectiveTruthScore / Math.max(0.01, maxDistractorScore)) : effectiveTruthScore;
          mappedScore10 = ratio * 4.9;
          mappedScore10 = Math.min(4.9, mappedScore10);
      }

      mappedScore10 = Math.max(0, Math.min(10, mappedScore10)); 

      if (hits === validTruths.length && validTruths.length > 0) {
        return { status: "success", score: mappedScore10, hotColdScore: maxEmbeddingSim };
      } else if (hits > 0) {
        return {
           status: "close",
           score: mappedScore10,
           hotColdScore: maxEmbeddingSim,
           customMessage: `${t?.partialMatch || "Partial Match!"} ${hits}/${validTruths.length} ${t?.correctConcepts || "correct concepts identified. Keep going!"}`
        };
      } else {
        if (maxDistractorScore > effectiveTruthScore) {
          return {
             status: "leaning_wrong",
             score: mappedScore10,
             hotColdScore: maxEmbeddingSim,
             wrongSim: maxDistractorScore,
             wrongTarget: closestIncorrectText
          };
        } else {
          return {
             status: "wrong",
             score: mappedScore10,
             hotColdScore: maxEmbeddingSim
          };
        }
      }
    } catch (err) {
      console.error(err);
      return { status: "error" };
    }
  };

  return { evaluateInput };
};
