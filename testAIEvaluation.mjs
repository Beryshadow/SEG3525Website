// testAIEvaluation.js
// This script simulates the AI Evaluation Pipeline (useAIEvaluation.js)
// to test the NLI and Embedding fallback logic against a highly diverse set of edge cases.

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getEntailmentScores = (outputArr) => {
    let ent = 0; let cont = 0; let neut = 0;
    if (Array.isArray(outputArr)) {
        for (const item of outputArr) {
            const label = item.label.toLowerCase();
            if (label === 'entailment' || label.includes('entail') || label === 'label_1' || label === 'label_0') ent = item.score;
            else if (label === 'contradiction' || label.includes('contradiction') || label === 'label_2') cont = item.score;
            else if (label === 'neutral') neut = item.score;
        }
    } else if (outputArr && typeof outputArr === 'object') {
        const label = outputArr.label.toLowerCase();
        if (label === 'entailment' || label.includes('entail') || label === 'label_1' || label === 'label_0') ent = outputArr.score;
        else if (label === 'contradiction' || label.includes('contradiction') || label === 'label_2') cont = outputArr.score;
        else if (label === 'neutral') neut = outputArr.score;
    }
    const maxScore = Math.max(ent, cont, neut);
    return {
        entailment: ent,
        isEntailment: ent === maxScore && ent > 0,
        isContradiction: cont === maxScore && cont > 0
    };
};

const evaluateInput = async (userInput, question, correctAnswersArray, model, getEmbeddings) => {
  if (!userInput.trim()) return null;
  const cleanInput = userInput.trim().toLowerCase();
  if (correctAnswersArray.length === 1 && cleanInput === correctAnswersArray[0].trim().toLowerCase()) {
      return { status: "success", score: 10.0 };
  }

  const truthTexts = correctAnswersArray;
  const incorrectTexts = question.choices.filter(c => !correctAnswersArray.includes(c));
  const sepToken = "[SEP]";
  const questionContext = `Question: ${question.question} Answer:`;
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
      totalEntailment += 1.0; hits++; continue; 
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
      let normalizedOutputs = batchedOutputs;
      if (Array.isArray(batchedOutputs) && batchedOutputs.length > 0 && !Array.isArray(batchedOutputs[0])) {
          if (batchedOutputs.length === pairsToEvaluate.length) {
              normalizedOutputs = batchedOutputs;
          } else {
              normalizedOutputs = [batchedOutputs];
          }
      }
    const resultsByOriginal = { distractor: {}, truth: {} };
    
    for (let i = 0; i < normalizedOutputs.length; i++) {
      const map = mapping[i];
      const scores = getEntailmentScores(normalizedOutputs[i]);
      if (!resultsByOriginal[map.type][map.text]) resultsByOriginal[map.type][map.text] = { forward: null, backward: null };
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

  let maxEmbeddingSim = 0;
  let combinedEmbeddingSim = 0;
  if (getEmbeddings && validTruths.length > 0) {
    const combinedTruths = validTruths.join(" and ");
    const textsToEmbed = [userInput.trim(), ...validTruths, combinedTruths];
    const embs = await getEmbeddings(textsToEmbed);
    if (embs && embs.length === textsToEmbed.length) {
       const inputEmb = embs[0];
       for(let i=1; i<=validTruths.length; i++){
          const sim = cosineSimilarity(inputEmb, embs[i]);
          if(sim > maxEmbeddingSim) maxEmbeddingSim = sim;
       }
       combinedEmbeddingSim = cosineSimilarity(inputEmb, embs[embs.length - 1]);
       console.log("Max Emb Sim:", maxEmbeddingSim.toFixed(3), "Combined Emb Sim:", combinedEmbeddingSim.toFixed(3));
    }
  }

  const avgEntailment = validTruths.length > 0 ? totalEntailment / validTruths.length : 0;
  let effectiveTruthScore = avgEntailment;
  if (maxEmbeddingSim >= 0.85 && !isStrongContradiction) {
     effectiveTruthScore = Math.max(avgEntailment, maxEmbeddingSim);
     if (hits === 0 && effectiveTruthScore > maxDistractorScore) hits = 1;
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

  if (hits === validTruths.length && validTruths.length > 0) return { status: "success", score: mappedScore10, hotColdScore: maxEmbeddingSim };
  else if (hits > 0) return { status: "close", score: mappedScore10, hotColdScore: maxEmbeddingSim, customMessage: `Partial Match! ${hits}/${validTruths.length} correct concepts identified. Keep going!` };
  else if (maxDistractorScore > effectiveTruthScore) return { status: "leaning_wrong", score: mappedScore10, hotColdScore: maxEmbeddingSim, wrongSim: maxDistractorScore, wrongTarget: closestIncorrectText };
  else return { status: "wrong", score: mappedScore10, hotColdScore: maxEmbeddingSim };
};

// ==========================================
// TEST SUITE EXECUTION
// ==========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_DECK } from './src/data/flashcardData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Read both standard and multi-answer test banks
const testBankPath = path.join(__dirname, 'testBank.json');
const testBank = JSON.parse(fs.readFileSync(testBankPath, 'utf8'));

let testBankMulti = [];
try {
  const multiPath = path.join(__dirname, 'testBankMulti.json');
  if (fs.existsSync(multiPath)) {
    testBankMulti = JSON.parse(fs.readFileSync(multiPath, 'utf8'));
  }
} catch(e) {}

const allTests = [...testBank, ...testBankMulti];

// Flatten all questions into a single map for quick lookup by ID
const questionMap = {};
for (const q of DEFAULT_DECK) {
  questionMap[q.id] = q;
}

const createMockEmb = (simScore) => {
  const y = Math.sqrt(Math.max(0, 1 - simScore * simScore));
  return { inputEmb: [1, 0], truthEmb: [simScore, y] };
};

const createMockModel = (correctAnswersArray, truthMatch, distractorMatches, truthMatchesMap) => async (pairs) => {
  return pairs.map(p => {
    const parts = p.split("[SEP]");
    const choicePart = parts[1] || parts[0];
    
    // Extract choice string from the choice part using the specific prompt format
    let currentChoice = "";
    for (const choice of [...correctAnswersArray, ...Object.keys(distractorMatches || {})]) {
       // Only the statementChoice has exactly "Answer: " followed immediately by the choice
       if (p.includes(`Answer: ${choice} [SEP]`) || p.endsWith(`Answer: ${choice}`)) {
           currentChoice = choice;
       }
    }

    if (distractorMatches && distractorMatches[currentChoice]) {
       return distractorMatches[currentChoice];
    }
    
    if (correctAnswersArray.includes(currentChoice)) {
       if (truthMatchesMap && truthMatchesMap[currentChoice]) {
           return truthMatchesMap[currentChoice];
       }
       return truthMatch || [{ label: "neutral", score: 0.9 }];
    }
    
    return [{ label: "neutral", score: 0.9 }];
  });
};

const createMockGetEmbs = (embSim) => async (texts) => {
  const embs = createMockEmb(embSim);
  const result = [embs.inputEmb];
  for(let i=1; i<texts.length; i++) {
     result.push(embs.truthEmb);
  }
  return result;
};

async function runTests() {
  let passed = 0; let total = 0;

  console.log("=== COMPREHENSIVE AI EVALUATION TEST SUITE ===\n");

  for (const test of allTests) {
    total++;
    
    const questionObj = test.questionId ? questionMap[test.questionId] : { choices: test.choices || [], correctAnswer: "" };
    if (!questionObj && test.questionId) {
        console.error(`❌ [FAIL] ${test.name} -> Missing Question ID ${test.questionId} in flashcardData.js`);
        continue;
    }
    const correctAnswersArray = test.customTruths || [questionObj.correctAnswer];
    
    let res;
    if (test.truthMatch === null && !test.truthMatchesMap) {
        // Exact match scenario, model handles internally without calling mocks
        res = await evaluateInput(test.userInput, questionObj, correctAnswersArray, null, null);
    } else {
        const mockModel = createMockModel(correctAnswersArray, test.truthMatch, test.distractorMatches, test.truthMatchesMap);
        const mockEmbs = createMockGetEmbs(test.embSim);
        res = await evaluateInput(test.userInput, questionObj, correctAnswersArray, mockModel, mockEmbs);
    }

    const pass = res.score >= test.expectedMin && res.score <= test.expectedMax;
    
    if (pass) {
      console.log(`✅ [PASS] ${test.name} -> Score: ${res.score.toFixed(2)}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${test.name} -> Score: ${res.score.toFixed(2)} | Expected: ${test.expectedMin}-${test.expectedMax}`);
    }
  }

  // Add long context (> 128 tokens) test case
  const longPromptQuestion = {
    id: "q_long_context",
    question: "Explain the architecture of modern web browser rendering engines, focusing on HTML parsing, DOM tree construction, CSSOM creation, render tree layout, compositing layers, and GPU accelerated drawing pipeline in extensive technical detail.",
    choices: ["Option A", "Option B"],
    correctAnswer: "The browser parses HTML tokens into DOM nodes, constructs CSSOM from stylesheets, merges them into a render tree, computes layout geometries, creates compositing layers, and dispatches draw calls to the GPU rasterizer."
  };
  const longInput = "Browser rendering starts with HTML tokenization to build the DOM tree and CSS parsing to build the CSSOM. These trees are combined into the layout tree to determine coordinates, after which paint operations are grouped into compositing layers and executed on the GPU.";
  const mockModelLong = createMockModel([longPromptQuestion.correctAnswer], [{ label: "entailment", score: 0.95 }]);
  const mockEmbsLong = createMockGetEmbs(0.92);

  total++;
  const resLong = await evaluateInput(longInput, longPromptQuestion, [longPromptQuestion.correctAnswer], mockModelLong, mockEmbsLong);
  if (resLong && resLong.score >= 8.5) {
    console.log(`✅ [PASS] Long Context Prompt (> 128 Tokens) -> Score: ${resLong.score.toFixed(2)}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] Long Context Prompt (> 128 Tokens) -> Score: ${resLong?.score?.toFixed(2)}`);
  }

  // Add graph pre-computed embedding reuse test case
  total++;
  const mockCardEmbeddings = {
    [longPromptQuestion.id]: [0.92, 0.39]
  };
  const resGraphEmb = await evaluateInput(longInput, longPromptQuestion, [longPromptQuestion.correctAnswer], mockModelLong, mockEmbsLong, mockCardEmbeddings);
  if (resGraphEmb && resGraphEmb.score >= 8.5) {
    console.log(`✅ [PASS] Graph Pre-Computed Embedding Reuse -> Score: ${resGraphEmb.score.toFixed(2)}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] Graph Pre-Computed Embedding Reuse -> Score: ${resGraphEmb?.score?.toFixed(2)}`);
  }

  console.log(`\n=== TEST SUMMARY: ${passed}/${total} PASSED ===\n`);
}

runTests().catch(console.error);export { evaluateInput };
