import { cosineSimilarity } from '../../../utilities/shared';

const embeddingCache = new Map();

export const useAIEvaluation = ({ model, getEmbeddings, t, currentLangKey }) => {

  const getEntailmentScores = (output, debugContext = "") => {
    const classes = Array.isArray(output) && Array.isArray(output[0]) ? output[0] : (Array.isArray(output) ? output : [output]);
    if (!classes || classes.length === 0 || !classes[0].label) {
      return { entailment: 0, isEntailment: false };
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

    try {
      const truthTexts = correctAnswersArray;
      const choicesArray = Array.isArray(question?.choices) ? question.choices : [];
      const incorrectTexts = choicesArray.filter(c => !correctAnswersArray.includes(c));
      const sepToken = model?.tokenizer?.sep_token || "[SEP]";
      const questionContext = currentLangKey === 'FR' ? `Question: ${question.question} Réponse:` : `Question: ${question.question} Answer:`;
      const statementUser = `${questionContext} ${userInput.trim()}`;
      
      const compositeDistractor = incorrectTexts.join(". ");
      const distractorField = [...incorrectTexts, compositeDistractor].filter(d => d.trim());
      const validTruths = truthTexts.filter(t => t.trim());

      const pairsToEvaluate = [];
      const mapping = []; 

      let hits = 0;
      let totalEntailment = 0;

      for (const dist of distractorField) {
        const statementChoice = `${questionContext} ${dist.trim()}`;
        pairsToEvaluate.push(`${statementUser} ${sepToken} ${statementChoice}`);
        mapping.push({ type: 'distractor', dir: 'forward', text: dist });
        pairsToEvaluate.push(`${statementChoice} ${sepToken} ${statementUser}`);
        mapping.push({ type: 'distractor', dir: 'backward', text: dist });
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
        mapping.push({ type: 'truth', dir: 'forward', text: truth });
        pairsToEvaluate.push(`${statementChoice} ${sepToken} ${statementUser}`);
        mapping.push({ type: 'truth', dir: 'backward', text: truth });
      }

      let maxDistractorScore = 0;
      let closestIncorrectText = null;
      let isStrongContradiction = false;

      if (pairsToEvaluate.length > 0) {
        const batchedOutputs = await model(pairsToEvaluate, { top_k: 5, topk: 5 });
        const normalizedOutputs = Array.isArray(batchedOutputs) && batchedOutputs.length > 0 && !Array.isArray(batchedOutputs[0])
            ? [batchedOutputs]
            : batchedOutputs;

        const resultsByOriginal = { distractor: {}, truth: {} };
        
        for (let i = 0; i < normalizedOutputs.length; i++) {
          const map = mapping[i];
          const out = normalizedOutputs[i];
          const scores = getEntailmentScores(out, `${map.type} (${map.dir})`);
          
          if (!resultsByOriginal[map.type][map.text]) {
             resultsByOriginal[map.type][map.text] = { forward: null, backward: null };
          }
          resultsByOriginal[map.type][map.text][map.dir] = scores;
        }

        for (const dist of distractorField) {
           const resInfo = resultsByOriginal.distractor[dist];
           if (resInfo && resInfo.forward && resInfo.backward) {
              const avgEnt = (resInfo.forward.entailment + resInfo.backward.entailment) / 2;
              if (avgEnt > maxDistractorScore) {
                  maxDistractorScore = avgEnt;
                  closestIncorrectText = dist === compositeDistractor ? "Composite Distractor" : dist;
              }
           }
        }

        for (const truth of validTruths) {
           const cleanTruth = truth.trim().toLowerCase();
           if (cleanInput === cleanTruth) continue; 
           const resInfo = resultsByOriginal.truth[truth];
           if (resInfo && resInfo.forward && resInfo.backward) {
              const avgEnt = (resInfo.forward.entailment + resInfo.backward.entailment) / 2;
              const isEnt = resInfo.forward.isEntailment || resInfo.backward.isEntailment;
              
              if (resInfo.forward.isContradiction && resInfo.backward.isContradiction) {
                 isStrongContradiction = true;
              }
              
              totalEntailment += avgEnt;
              if (avgEnt > maxDistractorScore && isEnt) {
                 hits++;
              }
           }
        }
      }

      // --- EMBEDDING RESCUE LOGIC (WITH SPEED OPTIMIZED LRU CACHING) ---
      let maxEmbeddingSim = 0;
      if (getEmbeddings && validTruths.length > 0) {
        try {
           const userText = userInput.trim();
           const uncached = [];

           if (!embeddingCache.has(userText)) uncached.push(userText);
           for (const truth of validTruths) {
             const key = truth.trim();
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
           }
        } catch (e) {
           console.error("Embedding gamification failed", e);
        }
      }

      const avgEntailment = validTruths.length > 0 ? totalEntailment / validTruths.length : 0;
      
      let effectiveTruthScore = avgEntailment;
      
      if (maxEmbeddingSim >= 0.85 && !isStrongContradiction) {
         effectiveTruthScore = Math.max(avgEntailment, maxEmbeddingSim);
         if (hits === 0 && effectiveTruthScore > maxDistractorScore) {
             hits = 1;
         }
      }
      
      let mappedScore10 = 0;
      if (hits === validTruths.length && validTruths.length > 0) {
          mappedScore10 = 5 + ((effectiveTruthScore - maxDistractorScore) / Math.max(0.01, 1 - maxDistractorScore)) * 5;
          if (effectiveTruthScore >= 0.90) mappedScore10 = 10.0;
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
