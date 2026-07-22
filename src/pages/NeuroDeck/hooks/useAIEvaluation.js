const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const detectLanguageFRorEN = (text) => {
  if (!text || typeof text !== 'string') return 'EN';
  const clean = text.toLowerCase();
  if (/[éèêëàâîïôûùç]/.test(clean)) return 'FR';
  
  const words = clean.split(/\W+/);
  let frScore = 0;
  let enScore = 0;
  
  const frWords = new Set(['le', 'la', 'les', 'des', 'du', 'un', 'une', 'est', 'sont', 'dans', 'pour', 'avec', 'par', 'sur', 'qui', 'que', 'quoi', 'comment', 'pourquoi', 'quand', 'ce', 'cette', 'ces', 'réponse']);
  const enWords = new Set(['the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'for', 'with', 'by', 'what', 'which', 'who', 'where', 'why', 'how', 'this', 'that', 'these', 'those', 'answer']);
  
  for (const w of words) {
    if (frWords.has(w)) frScore++;
    if (enWords.has(w)) enScore++;
  }
  
  if (frScore > enScore) return 'FR';
  if (enScore > frScore) return 'EN';
  return 'EN';
};

const embeddingCache = new Map();
const evalResultCache = new Map();

export const useAIEvaluation = ({ model, getEmbeddings, cardEmbeddings, t, currentLangKey }) => {

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

  const evaluateInput = async (userInput, question, correctAnswersArray = []) => {
    if (!userInput || typeof userInput !== 'string' || !userInput.trim()) return null;
    
    const safeCorrectAnswers = Array.isArray(correctAnswersArray) ? correctAnswersArray : [];
    const cleanInput = userInput.trim().toLowerCase();
    const cacheKey = `${question?.id || ''}_${cleanInput}`;
    if (evalResultCache.has(cacheKey)) {
      return evalResultCache.get(cacheKey);
    }

    const isPerfectSingleAnswer = safeCorrectAnswers.length === 1 && cleanInput === safeCorrectAnswers[0].trim().toLowerCase();
    
    if (isPerfectSingleAnswer) {
        return { status: "success", score: 10.0 };
    }

    if (!model) {
      return { status: "loading" };
    }

    const truthTexts = safeCorrectAnswers;
    const choicesArray = Array.isArray(question?.choices) ? question.choices : [];
    const incorrectTexts = choicesArray.filter(c => !safeCorrectAnswers.includes(c));
    const validTruths = truthTexts.filter(t => t && typeof t === 'string' && t.trim());
    const compositeDistractor = incorrectTexts.join(". ");
    const distractorField = [...incorrectTexts, compositeDistractor].filter(d => d && typeof d === 'string' && d.trim());

    // --- 1. REUSE GRAPH PRE-COMPUTED EMBEDDINGS & COMPUTE USER EMBEDDING (< 5ms) ---
    let maxEmbeddingSim = 0;
    let questionEmb = (cardEmbeddings && question && cardEmbeddings[question.id]) || null;
    let inputEmb = null;

    if (getEmbeddings) {
      try {
         const userText = userInput.trim();
         if (!embeddingCache.has(userText)) {
           const uncached = [userText];
           if (!questionEmb && validTruths[0] && !embeddingCache.has(validTruths[0])) {
             uncached.push(validTruths[0]);
           }
           const computed = await getEmbeddings(uncached);
           if (computed && Array.isArray(computed) && computed.length > 0) {
             embeddingCache.set(userText, computed[0]);
             if (!questionEmb && computed[1] && validTruths[0]) {
               embeddingCache.set(validTruths[0], computed[1]);
             }
           }
         }
         inputEmb = embeddingCache.get(userText);
         if (!questionEmb && validTruths[0]) {
           questionEmb = embeddingCache.get(validTruths[0]);
         }
      } catch (e) {
         console.error("Embedding fast lookup failed", e);
      }
    }

    if (inputEmb && questionEmb) {
      maxEmbeddingSim = cosineSimilarity(inputEmb, questionEmb);
    }

    // --- 2. MULTI-DIRECTIONAL MULTI-PASS NLI CROSS-ENCODER EVALUATION ---
    try {
      const sepToken = model?.tokenizer?.sep_token || "[SEP]";
      const detectedLang = detectLanguageFRorEN(question?.question) || currentLangKey || 'EN';
      const questionContext = detectedLang === 'FR' ? `Question: ${question?.question || ''} Réponse:` : `Question: ${question?.question || ''} Answer:`;
      const statementUser = `${questionContext} ${userInput.trim()}`;

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
        if (!batchedOutputs) {
           return { status: "wrong", score: 0.0, hotColdScore: maxEmbeddingSim };
        }

        const normalizedOutputs = Array.isArray(batchedOutputs) 
            ? (batchedOutputs.length > 0 && !Array.isArray(batchedOutputs[0]) ? [batchedOutputs] : batchedOutputs)
            : [];

        const resultsByOriginal = { distractor: {}, truth: {} };

        for (let i = 0; i < normalizedOutputs.length; i++) {
          const map = mapping[i];
          if (!map) continue;
          const out = normalizedOutputs[i];
          const scores = getEntailmentScores(out);
          
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
           } else if (resInfo && (resInfo.forward || resInfo.backward)) {
              const singleEnt = (resInfo.forward || resInfo.backward).entailment;
              if (singleEnt > maxDistractorScore) {
                  maxDistractorScore = singleEnt;
                  closestIncorrectText = dist === compositeDistractor ? "Composite Distractor" : dist;
              }
           }
        }

        for (const truth of validTruths) {
           const cleanTruth = truth.trim().toLowerCase();
           if (cleanInput === cleanTruth) continue; 
           const resInfo = resultsByOriginal.truth[truth];
           if (resInfo) {
              const f = resInfo.forward;
              const b = resInfo.backward;
              const avgEnt = f && b ? (f.entailment + b.entailment) / 2 : ((f || b)?.entailment || 0);
              const isEnt = (f && f.isEntailment) || (b && b.isEntailment);
              
              if (f?.isContradiction && b?.isContradiction) {
                 isStrongContradiction = true;
              }
              
              totalEntailment += avgEnt;
              if (avgEnt > maxDistractorScore && isEnt) {
                 hits++;
              }
           }
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

      let finalResult = { status: "wrong", score: mappedScore10, hotColdScore: maxEmbeddingSim };
      if (hits === validTruths.length && validTruths.length > 0) {
        finalResult = { status: "success", score: mappedScore10, hotColdScore: maxEmbeddingSim };
      } else if (hits > 0) {
        finalResult = {
           status: "close",
           score: mappedScore10,
           hotColdScore: maxEmbeddingSim,
           customMessage: `${t?.partialMatch || "Partial Match!"} ${hits}/${validTruths.length} ${t?.correctConcepts || "correct concepts identified. Keep going!"}`
        };
      } else if (maxDistractorScore > effectiveTruthScore) {
        finalResult = {
           status: "leaning_wrong",
           score: mappedScore10,
           hotColdScore: maxEmbeddingSim,
           wrongSim: maxDistractorScore,
           wrongTarget: closestIncorrectText
        };
      }

      if (evalResultCache.size > 200) {
        const firstKey = evalResultCache.keys().next().value;
        evalResultCache.delete(firstKey);
      }
      evalResultCache.set(cacheKey, finalResult);
      return finalResult;
    } catch (err) {
      console.error(err);
      return { status: "error" };
    }
  };

  return { evaluateInput };
};
