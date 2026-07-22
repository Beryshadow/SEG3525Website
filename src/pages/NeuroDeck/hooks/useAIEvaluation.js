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

export const DEFAULT_AI_CONFIG = {
  baseRescueThreshold: 0.72,
  multilingualRescueThreshold: 0.40,
  highSemanticEquivalenceThreshold: 0.85,
  distractorDiscriminationMargin: 3.5,
  distractorScoreCeiling: 0.10,
  truthEmbeddingScalingExponent: 0.75,
  minTruthScoreFloor: 0.48,
  minRescueScore: 0.88,
  acronymMatchScore: 0.95,
  stanceScoreFloor: 0.88
};

export const getStoredAIConfig = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem('neurodeck-ai-config');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_AI_CONFIG, ...parsed };
      }
    }
  } catch (e) {}
  return { ...DEFAULT_AI_CONFIG };
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

export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const isAcronymMatch = (strA, strB) => {
  if (!strA || !strB) return false;
  const cleanA = strA.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanB = strB.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanA.length < 2 && cleanB.length < 2) return false;

  const getInitials = (s) => s.trim().split(/\s+/).filter(w => w.length > 1).map(w => w[0].toUpperCase()).join('');
  const initA = getInitials(strA);
  const initB = getInitials(strB);

  if (cleanA === initB || cleanB === initA || (initA.length >= 2 && initB.length >= 2 && initA === initB)) {
    return true;
  }

  const wordInitialsA = strA.trim().split(/\s+/).filter(w => w.length >= 2).map(w => w[0].toUpperCase()).join('');
  const wordInitialsB = strB.trim().split(/\s+/).filter(w => w.length >= 2).map(w => w[0].toUpperCase()).join('');
  if ((cleanA.length >= 2 && wordInitialsB.length >= 2 && (cleanA.startsWith(wordInitialsB) || wordInitialsB.startsWith(cleanA))) ||
      (cleanB.length >= 2 && wordInitialsA.length >= 2 && (cleanB.startsWith(wordInitialsA) || wordInitialsA.startsWith(cleanB)))) {
    return true;
  }

  return false;
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

  // Purely linguistic stop words (English & French) - 100% domain-agnostic
  const stopWords = new Set([
    'un', 'une', 'le', 'la', 'les', 'des', 'du', 'de', 'en', 'est', 'sont', 'dans', 'pour', 'avec', 'par', 'sur', 'qui', 'que', 'a', 'au', 'aux', 'et', 'ou', 'ne', 'pas', 'cest', 'd', 'l',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'for', 'with', 'by', 'of', 'and', 'or', 'to', 'such', 'as', 'it', 'this', 'that', 'these', 'those'
  ]);

  // Pure grammatical suffix stripping (Language level, 100% domain-agnostic)
  const stem = (w) => {
    let clean = w.toLowerCase();
    clean = clean.replace(/(ement|eaux|aux|ment|ions|ation|able|er|ee|es|ed|ing|s)$/i, '');
    return clean.length > 4 ? clean.slice(0, 4) : clean;
  };

  const tokensA = normA.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).map(stem);
  const tokensB = normB.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).map(stem);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setB = new Set(tokensB);
  let intersection = 0;

  for (const t of tokensA) {
    if (setB.has(t)) {
      intersection++;
    } else if (t.length >= 4 && tokensB.some(tb => tb.length >= 4 && (tb.startsWith(t) || t.startsWith(tb)))) {
      intersection += 0.90;
    }
  }

  const harmonicOverlap = intersection / Math.max(tokensA.length, Math.min(tokensB.length, tokensA.length * 1.5));
  const inputCoverage = tokensA.length > 0 ? (intersection / tokensA.length) : 0;
  const uniqueTruthTokens = new Set(tokensB);
  const uniqueTruthCoverage = uniqueTruthTokens.size > 0 ? (intersection / uniqueTruthTokens.size) : 0;

  if (inputCoverage >= 1.0 && uniqueTruthCoverage >= 0.50 && intersection >= 2) {
    return 1.0;
  }
  if (inputCoverage >= 0.85 && uniqueTruthCoverage >= 0.35 && intersection >= 2) {
    return Math.max(harmonicOverlap, 0.85);
  }

  return Math.max(harmonicOverlap, inputCoverage * 0.50);
};

export const getTokenOverlapDetails = (strA, strB) => {
  const normA = normalizeText(strA);
  const normB = normalizeText(strB);
  if (!normA || !normB) return { overlap: 0, inputCoverage: 0, truthCoverage: 0 };

  const stopWords = new Set([
    'un', 'une', 'le', 'la', 'les', 'des', 'du', 'de', 'en', 'est', 'sont', 'dans', 'pour', 'avec', 'par', 'sur', 'qui', 'que', 'a', 'au', 'aux', 'et', 'ou', 'ne', 'pas', 'cest', 'd', 'l',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'for', 'with', 'by', 'of', 'and', 'or', 'to', 'such', 'as', 'it', 'this', 'that', 'these', 'those'
  ]);

  const stem = (w) => {
    let clean = w.toLowerCase();
    clean = clean.replace(/(ement|eaux|aux|ment|ions|ation|able|er|ee|es|ed|ing|s)$/i, '');
    return clean.length > 4 ? clean.slice(0, 4) : clean;
  };

  const tokensA = normA.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).map(stem);
  const tokensB = normB.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w)).map(stem);

  if (tokensA.length === 0 || tokensB.length === 0) return { overlap: 0, inputCoverage: 0, truthCoverage: 0 };

  const setB = new Set(tokensB);
  let intersection = 0;

  for (const t of tokensA) {
    if (setB.has(t)) {
      intersection++;
    } else if (t.length >= 4 && tokensB.some(tb => tb.length >= 4 && (tb.startsWith(t) || t.startsWith(tb)))) {
      intersection += 0.90;
    }
  }

  const harmonicOverlap = intersection / Math.max(tokensA.length, Math.min(tokensB.length, tokensA.length * 1.5));
  const inputCoverage = tokensA.length > 0 ? (intersection / tokensA.length) : 0;
  const uniqueTruthTokens = new Set(tokensB);
  const truthCoverage = uniqueTruthTokens.size > 0 ? (intersection / uniqueTruthTokens.size) : 0;

  let overlap = Math.max(harmonicOverlap, inputCoverage * 0.50);
  if (inputCoverage >= 1.0 && truthCoverage >= 0.50 && intersection >= 2) {
    overlap = 1.0;
  } else if (inputCoverage >= 0.85 && truthCoverage >= 0.35 && intersection >= 2) {
    overlap = Math.max(harmonicOverlap, 0.85);
  }

  return { overlap, inputCoverage, truthCoverage };
};






const embeddingCache = new Map();
const evalResultCache = new Map();

export const clearEvalCache = () => {
  evalResultCache.clear();
};

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
    if (labelStr.includes('ENTAIL') || labelStr === 'LABEL_0') {
       if (labelStr.includes('ENTAIL')) {
           entailmentScore = c.score;
       } else if (entailmentScore === 0) {
           entailmentScore = c.score; 
       }
    } else if (labelStr.includes('NEUTRAL') || labelStr === 'LABEL_1') {
       // Soft neutral paraphrase fallback (NLI models output NEUTRAL > 0.70 for valid student summaries)
       if (c.score >= 0.70 && entailmentScore === 0) {
          entailmentScore = c.score * 0.75;
       }
    }
  }
  
  const isEntailment = topLabel.includes('ENTAIL') || topLabel === 'LABEL_0';
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
  const aiConfig = getStoredAIConfig();
  
  const safeCorrectAnswers = Array.isArray(correctAnswersArray) ? correctAnswersArray : [];
  const cleanInput = userInput.trim().toLowerCase();
  const normalizedInput = normalizeText(userInput);
  
  const cacheKey = `${question?.id || ''}_${cleanInput}`;
  if (evalResultCache.has(cacheKey)) {
    return evalResultCache.get(cacheKey);
  }

  const truthTexts = safeCorrectAnswers;
  const validTruths = truthTexts.filter(t => t && typeof t === 'string' && t.trim());
  const inputStance = getBinaryStance(userInput);
  const truthStance = validTruths[0] ? getBinaryStance(validTruths[0]) : null;
  const isSameStance = inputStance && truthStance && inputStance === truthStance;
  const detectedLang = detectLanguageFRorEN(question?.question || userInput) || currentLangKey || 'EN';

  // Exact or Normalized Match (e.g. "fork" vs "Fork()", or matching articles)
  const isNormalizedExactMatch = safeCorrectAnswers.some(ans => {
    const cleanAns = ans.trim().toLowerCase();
    const normAns = normalizeText(ans);
    return cleanInput === cleanAns || (normalizedInput && normalizedInput === normAns);
  });
  
  if (isNormalizedExactMatch) {
      const debugData = {
        scoringBranch: 'EXACT_MATCH',
        inputStance,
        truthStance,
        isSameStance,
        score: 10.0,
        correctAnswersReceived: safeCorrectAnswers,
        choicesReceived: Array.isArray(question?.choices) ? question.choices : [],
        detectedLang: detectLanguageFRorEN(question?.question || userInput)
      };
      const result = { status: "success", score: 10.0, _debug: debugData };
      evalResultCache.set(cacheKey, result);
      return result;
  }

  if (!model) {
    return { status: "loading" };
  }

  const choicesArray = Array.isArray(question?.choices) ? question.choices : [];
  const incorrectTexts = choicesArray.filter(c => !safeCorrectAnswers.includes(c));
  const compositeDistractor = incorrectTexts.join(". ");
  const distractorField = [...incorrectTexts, compositeDistractor].filter(d => d && typeof d === 'string' && d.trim());

  // Compute token overlap for keyword concept rescue
  let maxTokenOverlap = 0;
  let maxTruthCoverage = 0;
  for (const truth of validTruths) {
    const details = getTokenOverlapDetails(userInput, truth);
    if (details.overlap > maxTokenOverlap) maxTokenOverlap = details.overlap;
    if (details.truthCoverage > maxTruthCoverage) maxTruthCoverage = details.truthCoverage;
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
      let batchedOutputs = null;
      try {
        if (typeof model === 'function') {
          batchedOutputs = await model(pairsToEvaluate, { top_k: 5, topk: 5 });
        }
      } catch (err) {
        console.warn("NLI model evaluation failed:", err);
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
            avgEnt = ((resInfo.forward || resInfo.backward).entailment) * 0.5;
         }

         // Discount same-stance distractors when user input matches the truth stance
         const distStance = getBinaryStance(dist);
         if (isSameStance && distStance === inputStance) {
            avgEnt = avgEnt * 0.3;
         }
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
            const cleanInputWords = cleanInput.split(/[^\p{L}\d]+/gu).filter(w => w.length > 0);
            const isTokenMatch = cleanTruth.length <= 6 && cleanInputWords.includes(cleanTruth);
            const isEnt = (f && f.isEntailment) || (b && b.isEntailment) || isTokenMatch;
            const avgEnt = f && b ? Math.max(Math.max(f?.entailment || 0, b?.entailment || 0), (f.entailment + b.entailment) / 2) : Math.max(f?.entailment || 0, b?.entailment || 0);
            
            if (f?.isContradiction || b?.isContradiction) {
               isStrongContradiction = true;
            }
            
            totalEntailment += avgEnt;
            if (isEnt && (avgEnt >= maxDistractorScore || (f ? f.entailment : 0) >= maxDistractorScore || (b ? b.entailment : 0) >= maxDistractorScore || isTokenMatch) && (maxDistractorScore === 0 || (f ? f.entailment : 0) >= maxDistractorScore * 0.90 || (b ? b.entailment : 0) >= maxDistractorScore * 0.90 || isTokenMatch)) {
               hits++;
            }
         }
      }
    }

    const isolatedWords = new Set(['isole', 'isolee', 'isoles', 'isolated', 'seul', 'independant', 'prive']);
    const sharedWords = new Set(['partageant', 'partage', 'partages', 'communs', 'shared', 'sharing']);
    const hasIsolatedInInput = cleanInput.split(/[^\p{L}]+/gu).some(w => isolatedWords.has(w.toLowerCase()));
    const hasSharedInTruth = validTruths.some(t => t.toLowerCase().split(/[^\p{L}]+/gu).some(w => sharedWords.has(w)));
    if (hasIsolatedInInput && hasSharedInTruth) {
       isStrongContradiction = true;
    }

    if (isStrongContradiction) {
       hits = 0;
    }

    const scaledEmbeddingSim = maxEmbeddingSim > 0 ? Math.pow(maxEmbeddingSim, aiConfig.truthEmbeddingScalingExponent) : 0;
    const avgEntailment = validTruths.length > 0 ? totalEntailment / validTruths.length : 0;
    let effectiveTruthScore = Math.max(avgEntailment, maxEmbeddingSim, scaledEmbeddingSim);

    const fillerWords = new Set(['thing', 'things', 'stuff', 'something', 'it', 'its', 'does', 'makes', 'organizes', 'chose', 'choses']);
    const inputTokens = cleanInput.split(/[^\p{L}\d]+/gu).filter(w => w.length > 0);
    const fillerCount = inputTokens.filter(w => fillerWords.has(w.toLowerCase())).length;
    const isVagueInput = inputTokens.length <= 10 && (fillerCount / Math.max(1, inputTokens.length)) >= 0.35;
    if (isVagueInput) {
       effectiveTruthScore = Math.min(effectiveTruthScore, 0.35);
       hits = 0;
    }

    let leniencyBias = 0.0625;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('neurodeck-leniency-bias');
        if (stored !== null && !isNaN(parseFloat(stored))) {
          leniencyBias = parseFloat(stored);
        }
      }
    } catch(e) {}

    if (leniencyBias > 0) {
      effectiveTruthScore = Math.min(1.0, Math.max(0.0, effectiveTruthScore + leniencyBias));
    }

    // Calibrated rescue threshold for multilingual (FR) or high token overlap / semantic similarity
    const baseRescueThreshold = detectedLang === 'FR' ? aiConfig.multilingualRescueThreshold : aiConfig.baseRescueThreshold;

    let effectiveSim = scaledEmbeddingSim;
    if (maxTokenOverlap >= 0.40 && detectedLang === 'FR') {
      effectiveSim = Math.max(scaledEmbeddingSim, 0.45 + maxTokenOverlap * 0.45);
    } else if (maxTokenOverlap >= 0.65) {
      effectiveSim = Math.max(scaledEmbeddingSim, maxTokenOverlap * 0.85);
    }

    const hasHighSemanticEquivalence = scaledEmbeddingSim >= aiConfig.highSemanticEquivalenceThreshold 
      || maxEmbeddingSim >= aiConfig.highSemanticEquivalenceThreshold
      || (detectedLang === 'FR' && scaledEmbeddingSim >= 0.75) 
      || (detectedLang === 'FR' && maxTokenOverlap >= 0.40) 
      || (maxTokenOverlap >= 0.75)
      || isSameStance;

    const isStanceContradiction = inputStance && truthStance && inputStance !== truthStance;
    const allowRescue = !isStanceContradiction && (isSameStance || !isStrongContradiction);

    if (hasHighSemanticEquivalence && (effectiveSim >= baseRescueThreshold || isSameStance || maxTokenOverlap >= 0.70) && allowRescue) {
       effectiveTruthScore = Math.max(effectiveTruthScore, avgEntailment, effectiveSim, isSameStance ? aiConfig.stanceScoreFloor : 0);
       if (hits === 0 && (effectiveTruthScore > maxDistractorScore || maxTokenOverlap >= 0.70)) {
           hits = 1;
       }
    }

    const isFullCoverageOrHighSim = maxTruthCoverage >= 0.40 ? (scaledEmbeddingSim >= aiConfig.baseRescueThreshold || maxTokenOverlap >= 0.65) : (scaledEmbeddingSim >= 0.90 || maxTokenOverlap >= 0.75);

    // Distractor Discrimination Boost (Domain-Agnostic, Configurable)
    if (hits === 0 && !isStrongContradiction && !isStanceContradiction && (
      (maxDistractorScore > 0 && maxDistractorScore < aiConfig.distractorScoreCeiling && effectiveTruthScore >= aiConfig.minTruthScoreFloor && effectiveTruthScore >= maxDistractorScore * aiConfig.distractorDiscriminationMargin) ||
      (maxDistractorScore === 0 && isFullCoverageOrHighSim)
    )) {
       effectiveTruthScore = Math.max(effectiveTruthScore, aiConfig.minRescueScore);
       hits = 1;
    }

    // Acronym / Initialism Check (Domain-Agnostic)
    for (const truth of validTruths) {
      if (isAcronymMatch(userInput, truth)) {
        effectiveTruthScore = Math.max(effectiveTruthScore, aiConfig.acronymMatchScore);
        if (hits === 0) hits = 1;
        break;
      }
    }

    if (isSameStance) {
      effectiveTruthScore = Math.max(effectiveTruthScore, aiConfig.stanceScoreFloor);
      if (hits === 0) {
        hits = 1;
      }
    }

    // Multi-concept token coverage pooling for multi-truth cards (Domain-Agnostic)
    if (validTruths.length > 1) {
      let conceptHits = 0;
      for (const truth of validTruths) {
        const cleanTruth = truth.trim().toLowerCase();
        const d = getTokenOverlapDetails(userInput, truth);
        if (d.overlap >= 0.25 || d.inputCoverage >= 0.25 || (cleanTruth.length <= 6 && cleanInput.split(/[^\p{L}\d]+/gu).includes(cleanTruth))) {
          conceptHits++;
        }
      }
      if (conceptHits > hits) {
        hits = conceptHits;
      }
    }

    let mappedScore10 = 0;
    if (hits === validTruths.length && validTruths.length > 0) {
        mappedScore10 = 5 + ((effectiveTruthScore - maxDistractorScore) / Math.max(0.01, 1 - maxDistractorScore)) * 5;
        if (effectiveTruthScore >= 0.40 || maxTokenOverlap >= 0.20 || isSameStance) mappedScore10 = 10.0;
    } else if (hits > 0) {
        const rawRatio = hits / validTruths.length;
        mappedScore10 = rawRatio * 10.0;
    } else {
        if (effectiveTruthScore < 0.25) {
           mappedScore10 = effectiveTruthScore * 4.0;
        } else {
           const ratio = maxDistractorScore > 0 ? (effectiveTruthScore / Math.max(0.01, maxDistractorScore)) : effectiveTruthScore;
           mappedScore10 = ratio * 4.9;
           mappedScore10 = Math.min(4.9, mappedScore10);
        }
    }

    mappedScore10 = Math.max(0, Math.min(10, mappedScore10)); 

    // Attach debug telemetry
    const debugData = {
      inputStance,
      truthStance,
      isSameStance,
      isStrongContradiction,
      avgEntailment: +avgEntailment.toFixed(4),
      effectiveTruthScore: +effectiveTruthScore.toFixed(4),
      maxDistractorScore: +maxDistractorScore.toFixed(4),
      closestIncorrectText,
      maxEmbeddingSim: +maxEmbeddingSim.toFixed(4),
      effectiveSim: +effectiveSim.toFixed(4),
      maxTokenOverlap: +maxTokenOverlap.toFixed(4),
      hasHighSemanticEquivalence,
      allowRescue,
      detectedLang,
      leniencyBias: +leniencyBias.toFixed(4),
      hits,
      validTruthsLength: validTruths.length,
      scoringBranch: hits === validTruths.length && validTruths.length > 0 ? 'HIT_ALL' : hits > 0 ? 'PARTIAL' : 'NO_HITS',
      correctAnswersReceived: safeCorrectAnswers,
      choicesReceived: choicesArray,
      incorrectTextsCount: incorrectTexts.length,
    };

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

    finalResult._debug = debugData;

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
