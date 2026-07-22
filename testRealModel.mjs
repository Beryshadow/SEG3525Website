import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the evaluation hook directly
import { evaluateInput } from './testAIEvaluation.mjs';

import { DEFAULT_DECK } from './src/data/flashcardData.js';

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

// Pick 5 representative tests to avoid waiting 10 minutes on CPU
const testNamesToRun = [
    "Q6. Synonym Match",
    "Q28. False Positive Trap (Semantic Rescue)",
    "Q31. Synonym / Acronym",
    "M16. Leniency (Different Wording, Same Logic)",
    "M18. Order Dependent False Positive Trap"
];

const testsToRun = allTests.filter(t => testNamesToRun.includes(t.name) || t.name.includes("Binary Stance"));

const questionMap = {};
for (const q of DEFAULT_DECK) {
  questionMap[q.id] = q;
}

async function runRealTests() {
    console.log("Loading real models from HuggingFace (this may take a moment to download weights)...");
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    
    console.log("Loading NLI model (Xenova/nli-deberta-v3-small)...");
    const classifier = await pipeline("text-classification", "Xenova/nli-deberta-v3-small", { quantized: true });
    
    console.log("Loading Embedding model (Xenova/all-MiniLM-L6-v2)...");
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });

    const realModel = async (pairs) => {
        const out = await classifier(pairs, { topk: 3 });
        console.log("RAW NLI OUT:", JSON.stringify(out, null, 2));
        return out;
    };

    const realGetEmbs = async (texts) => {
        const out = await extractor(texts, { pooling: "mean", normalize: true });
        const lst = out.tolist();
        console.log("RAW EMB OUT LENGTH:", lst.length, "DIM:", lst[0].length);
        return lst;
    };

    let passed = 0;
    
    console.log("\n=== REAL MODEL AI EVALUATION TEST SUITE ===");
    for (const test of testsToRun) {
        console.log(`\nEvaluating: ${test.name}`);
        const questionObj = test.questionId ? questionMap[test.questionId] : { choices: test.choices || [], correctAnswers: [], correctAnswer: "" };
        const correctAnswersArray = test.customTruths || questionObj.correctAnswers || (questionObj.correctAnswer ? [questionObj.correctAnswer] : []);
        
        try {
            const res = await evaluateInput(test.userInput, questionObj, correctAnswersArray, realModel, realGetEmbs);
            
            const score = res.score;
            let passStr = "";
            if (score >= test.expectedMin && score <= test.expectedMax) {
                passStr = "✅ [PASS]";
                passed++;
            } else {
                passStr = `❌ [FAIL] (Expected: ${test.expectedMin}-${test.expectedMax})`;
            }
            console.log(`${passStr} ${test.name} -> Score: ${score.toFixed(2)} (Status: ${res.status})`);
        } catch(e) {
            console.error(`Error running test ${test.name}:`, e);
        }
    }
    
    console.log(`\n=== REAL TEST SUMMARY: ${passed}/${testsToRun.length} PASSED ===`);
    process.exit(passed === testsToRun.length ? 0 : 1);
}

runRealTests();
