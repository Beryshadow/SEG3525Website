import { detectLanguageFRorEN, normalizeText, getTokenOverlap, evaluateInputCore as evaluateInput, clearAIEvaluationCaches } from './src/pages/NeuroDeck/hooks/useAIEvaluation.js';


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

const createMockModel = (correctAnswersArray, truthMatch, distractorMatches, truthMatchesMap, questionChoices = []) => async (pairs) => {
  return pairs.map(p => {
    const parts = p.split("[SEP]");
    const p0 = (parts[0] || "").trim().toLowerCase();
    const p1 = (parts[1] || "").trim().toLowerCase();
    
    let currentChoice = "";
    const allChoices = [...new Set([...correctAnswersArray, ...Object.keys(distractorMatches || {}), ...questionChoices])];

    // Priority 1: Exact match on part0 or part1
    for (const choice of allChoices) {
       const cleanChoice = choice.trim().toLowerCase();
       if (p0 === cleanChoice || p1 === cleanChoice) {
           currentChoice = choice;
           break;
       }
    }

    // Priority 2: Fallback substring search
    if (!currentChoice) {
      for (const choice of allChoices) {
         if (p.includes(`Answer: ${choice}`) || p.includes(choice)) {
             currentChoice = choice;
             break;
         }
      }
    }

    if (distractorMatches && distractorMatches[currentChoice]) {
       return distractorMatches[currentChoice];
    }
    
    if (correctAnswersArray.includes(currentChoice)) {
       if (truthMatchesMap && truthMatchesMap[currentChoice]) {
           return truthMatchesMap[currentChoice];
       }
       return truthMatch || [{ label: "neutral", score: 0.0 }];
    }
    
    return [{ label: "neutral", score: 0.0 }];
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
    clearAIEvaluationCaches();
    
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
        const mockModel = createMockModel(correctAnswersArray, test.truthMatch, test.distractorMatches, test.truthMatchesMap, questionObj.choices || []);

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

  // Add micro language detector (FR vs EN) test case
  const frQuestion = "Qu'est-ce que le DOM et comment fonctionne-t-il dans le navigateur ?";
  const enQuestion = "What is the DOM tree and how does it render in modern web browsers?";
  const frLang = detectLanguageFRorEN(frQuestion);
  const enLang = detectLanguageFRorEN(enQuestion);

  total++;
  if (frLang === 'FR' && enLang === 'EN') {
    console.log(`✅ [PASS] Micro Language Detector (FR: ${frLang}, EN: ${enLang})`);
    passed++;
  } else {
    console.error(`❌ [FAIL] Micro Language Detector -> Expected FR/EN, got ${frLang}/${enLang}`);
  }

  console.log(`\n=== TEST SUMMARY: ${passed}/${total} PASSED ===\n`);
}

runTests().catch(console.error);export { evaluateInput };
