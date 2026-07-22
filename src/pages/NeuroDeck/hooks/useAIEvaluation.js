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

export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  // Fold diacritics / accents (e.g., é->e, è->e, ê->e, à->a, ô->o, û->u, ç->c)
  let cleaned = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  // Strip parens from function calls e.g., "fork()" -> "fork", "main(void)" -> "main"
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ');
  // Normalize quotes and apostrophes
  cleaned = cleaned.replace(/[''’]/g, "'");
  // Remove leading articles (English and French)
  cleaned = cleaned.replace(/^(un|une|le|la|les|des|du|l'|d'|a|an|the)\s+/i, '');
  // Strip punctuation
  cleaned = cleaned.replace(/[^\p{L}\p{N}\s]/gu, '');
  // Collapse whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
};

export const getTokenOverlap = (strA, strB) => {
  const normA = normalizeText(strA);
  const normB = normalizeText(strB);
  if (!normA || !normB) return 0;

  // Purely linguistic stop words (English & French) - 100% domain-agnostic (no topic-specific terms)
  const stopWords = new Set([
    'un', 'une', 'le', 'la', 'les', 'des', 'du', 'de', 'en', 'est', 'sont', 'dans', 'pour', 'avec', 'par', 'sur', 'qui', 'que', 'a', 'au', 'aux', 'et', 'ou', 'ne', 'pas', 'cest', 'd', 'l',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'for', 'with', 'by', 'of', 'and', 'or', 'to', 'such', 'as', 'it', 'this', 'that', 'these', 'those'
  ]);
  const stem = (w) => w.length > 5 ? w.slice(0, 5) : w;

  const tokensA = normA.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).map(stem);
  const tokensB = normB.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).map(stem);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of tokensA) {
    if (setB.has(t)) intersection++;
  }

  const harmonicOverlap = intersection / Math.max(tokensA.length, Math.min(tokensB.length, tokensA.length * 1.5));
  const inputCoverage = tokensA.length > 0 ? (intersection / tokensA.length) : 0;
  const uniqueTruthTokens = new Set(tokensB);
  const uniqueTruthCoverage = uniqueTruthTokens.size > 0 ? (intersection / uniqueTruthTokens.size) : 0;

  if (inputCoverage >= 1.0 && uniqueTruthCoverage >= 0.50 && intersection >= 2) {
    return 1.0;
  }
  if (inputCoverage >= 0.85 && uniqueTruthCoverage >= 0.40 && intersection >= 2) {
    return Math.max(harmonicOverlap, 0.85);
  }

  return harmonicOverlap;
};






const embeddingCache = new Map();
const evalResultCache = new Map();

export const clearAIEvaluationCaches = () => {
  embeddingCache.clear();
  evalResultCache.clear();
};

export const getStoredLeniencyBias = () => {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const stored = localStorage.getItem('neurodeck-leniency-bias');
    if (stored !== null && !isNaN(parseFloat(stored))) {
      return parseFloat(stored);
    }
    return 0.0625; // Default starting bias (75% strictness)
  } catch (e) {
    return 0;
  }
};


export const updateLeniencyBiasOnOverride = (aiScoreRatio = 0.4) => {
  const currentBias = getStoredLeniencyBias();
  const loss = Math.max(0.15, 1.0 - aiScoreRatio);
  const targetShift = 0.08 * loss;
  const rawTarget = currentBias + targetShift;

  // EMA momentum smoothing (alpha = 0.25) to prevent pingponging
  const smoothedBias = (1 - 0.25) * currentBias + 0.25 * rawTarget;
  const boundedBias = Math.min(0.25, Math.max(-0.15, smoothedBias));

  try {
    localStorage.setItem('neurodeck-leniency-bias', boundedBias.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {}

  return boundedBias;
};

export const updateLeniencyBiasOnNormalPass = () => {
  const currentBias = getStoredLeniencyBias();
  const baseline = 0.0625;
  if (currentBias === baseline) return baseline;

  // L2 Regularization weight decay (2% pull back to baseline per normal turn)
  // Prevents unbounded runaway leniency growth and lets strictness settle smoothly
  const decayedBias = baseline + (currentBias - baseline) * 0.98;
  const finalBias = Math.abs(decayedBias - baseline) < 0.005 ? baseline : decayedBias;

  try {
    localStorage.setItem('neurodeck-leniency-bias', finalBias.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {}

  return finalBias;
};

export const updateLeniencyBiasOnFail = () => {
  const currentBias = getStoredLeniencyBias();
  // Mild tightening signal if user failed or got MCQ wrong
  const target = currentBias - 0.015;
  const finalBias = Math.max(-0.15, target);

  try {
    localStorage.setItem('neurodeck-leniency-bias', finalBias.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {}

  return finalBias;
};




export const getEntailmentScores = (output) => {
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


export const getBinaryStance = (text) => {
  if (!text || typeof text !== 'string') return null;
  const firstWord = text.trim().toLowerCase().split(/\s+/)[0].replace(/[^\p{L}]/gu, '');
  const yesSet = new Set(['oui', 'yes', 'vrai', 'true', 'si', 'ja', 'da']);
  const noSet = new Set(['non', 'no', 'faux', 'false', 'nein', 'nyet']);
  if (yesSet.has(firstWord)) return 'YES';
  if (noSet.has(firstWord)) return 'NO';
  return null;
};

export const evaluateInputCore = async (userInput, question, correctAnswersArray = [], model = null, getEmbeddings = null, cardEmbeddings = null, t = null, currentLangKey = 'EN') => {
  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) return null;
  
  const safeCorrectAnswers = Array.isArray(correctAnswersArray) ? correctAnswersArray : [];
  const cleanInput = userInput.trim().toLowerCase();
  const normalizedInput = normalizeText(userInput);
  
  const cacheKey = `${question?.id || ''}_${cleanInput}`;
  if (evalResultCache.has(cacheKey)) {
    return evalResultCache.get(cacheKey);
  }

  // Exact or Normalized Match (e.g. "fork" vs "Fork()", or matching articles)
  const isNormalizedExactMatch = safeCorrectAnswers.some(ans => {
    const cleanAns = ans.trim().toLowerCase();
    const normAns = normalizeText(ans);
    return cleanInput === cleanAns || (normalizedInput && normalizedInput === normAns);
  });
  
  if (isNormalizedExactMatch) {
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

  // Compute token overlap for keyword concept rescue
  let maxTokenOverlap = 0;
  for (const truth of validTruths) {
    const overlap = getTokenOverlap(userInput, truth);
    if (overlap > maxTokenOverlap) maxTokenOverlap = overlap;
  }

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

  // Detect universal binary stances (Yes/No, Oui/Non, True/False, Vrai/Faux)
  const inputStance = getBinaryStance(userInput);
  const truthStance = validTruths[0] ? getBinaryStance(validTruths[0]) : null;
  const isSameStance = inputStance && truthStance && inputStance === truthStance;

  // --- 2. MULTI-DIRECTIONAL DUAL-PASS DIRECT NLI CROSS-ENCODER EVALUATION ---
  try {
    const sepToken = model?.tokenizer?.sep_token || "[SEP]";
    const detectedLang = detectLanguageFRorEN(question?.question || userInput) || currentLangKey || 'EN';
    const userRaw = userInput.trim();

    const pairsToEvaluate = [];
    const mapping = []; 

    let hits = 0;
    let totalEntailment = 0;

    for (const dist of distractorField) {
      const distRaw = dist.trim();
      pairsToEvaluate.push(`${userRaw} ${sepToken} ${distRaw}`);
      mapping.push({ type: 'distractor', dir: 'forward', text: dist });
      pairsToEvaluate.push(`${distRaw} ${sepToken} ${userRaw}`);
      mapping.push({ type: 'distractor', dir: 'backward', text: dist });
    }

    for (const truth of validTruths) {
      const cleanTruth = truth.trim().toLowerCase();
      const normTruth = normalizeText(truth);
      if (cleanInput === cleanTruth || (normalizedInput && normalizedInput === normTruth)) {
        totalEntailment += 1.0;
        hits++;
        continue; 
      }
      const truthRaw = truth.trim();
      pairsToEvaluate.push(`${userRaw} ${sepToken} ${truthRaw}`);
      mapping.push({ type: 'truth', dir: 'forward', text: truth });
      pairsToEvaluate.push(`${truthRaw} ${sepToken} ${userRaw}`);
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
         let avgEnt = 0;
         if (resInfo && resInfo.forward && resInfo.backward) {
            avgEnt = (resInfo.forward.entailment + resInfo.backward.entailment) / 2;
         } else if (resInfo && (resInfo.forward || resInfo.backward)) {
            avgEnt = (resInfo.forward || resInfo.backward).entailment;
         }

         // Discount same-stance distractors when user input matches the truth stance
         const distStance = getBinaryStance(dist);
         if (isSameStance && distStance === inputStance) {
            avgEnt = avgEnt * 0.3;
         }
         // Also discount the composite distractor when isSameStance is true:
         // The composite joins all wrong answers (mixed stances) into one string,
         // which can produce spuriously high NLI scores against terse stance inputs like "Non"
         if (isSameStance && dist === compositeDistractor) {
            avgEnt = avgEnt * 0.3;
         }

         if (avgEnt > maxDistractorScore) {
             maxDistractorScore = avgEnt;
             closestIncorrectText = dist === compositeDistractor ? "Composite Distractor" : dist;
         }
      }

      for (const truth of validTruths) {
         const cleanTruth = truth.trim().toLowerCase();
         const normTruth = normalizeText(truth);
         if (cleanInput === cleanTruth || (normalizedInput && normalizedInput === normTruth)) continue; 
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

    // Apply adaptive learned leniency bias from user supervision / slider (Default starting strictness is 75%, bias = 0.0625)
    let leniencyBias = 0.0625;
    try {
      const stored = localStorage.getItem('neurodeck-leniency-bias');
      if (stored !== null && !isNaN(parseFloat(stored))) {
        leniencyBias = parseFloat(stored);
      }
    } catch(e) {}

    if (leniencyBias !== 0 && effectiveTruthScore > 0) {
      effectiveTruthScore = Math.min(1.0, Math.max(0.0, effectiveTruthScore + leniencyBias));
    }



    // Calibrated rescue threshold for multilingual (FR) or high token overlap / semantic similarity
    const baseRescueThreshold = detectedLang === 'FR' ? 0.50 : 0.72;

    let effectiveSim = maxEmbeddingSim;
    if (maxTokenOverlap >= 0.50 && detectedLang === 'FR') {
      effectiveSim = Math.max(maxEmbeddingSim, 0.50 + maxTokenOverlap * 0.40);
    } else if (maxTokenOverlap >= 0.75) {
      effectiveSim = Math.max(maxEmbeddingSim, maxTokenOverlap * 0.85);
    }

    const hasHighSemanticEquivalence = maxEmbeddingSim >= 0.85 || (detectedLang === 'FR' && maxEmbeddingSim >= 0.82) || maxTokenOverlap >= 0.55 || isSameStance;

    // Semantic rescue: boost truth score when semantic equivalence is high and no strong contradiction
    // When isSameStance is true, bypass isStrongContradiction — for yes/no questions, matching stance
    // is a stronger signal than NLI contradiction (a terse "Non" vs long "Non, ..." confuses the NLI model)
    const allowRescue = isSameStance || !isStrongContradiction;

    if (hasHighSemanticEquivalence && (effectiveSim >= baseRescueThreshold || isSameStance) && allowRescue) {
       effectiveTruthScore = Math.max(avgEntailment, effectiveSim, isSameStance ? 0.88 : 0);
       if (hits === 0 && effectiveTruthScore > maxDistractorScore) {
           hits = 1;
       }
    }

    // isSameStance is the final authority: if the user's binary stance matches the truth's stance,
    // guarantee a minimum score floor regardless of NLI model confusion
    if (isSameStance) {
      effectiveTruthScore = Math.max(effectiveTruthScore, 0.88);
      if (hits === 0) {
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

export const useAIEvaluation = ({ model, getEmbeddings, cardEmbeddings, t, currentLangKey }) => {
  const evaluateInput = async (userInput, question, correctAnswersArray = []) => {
    return evaluateInputCore(userInput, question, correctAnswersArray, model, getEmbeddings, cardEmbeddings, t, currentLangKey);
  };

  return { evaluateInput };
};
