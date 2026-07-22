import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline, env } from '@huggingface/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment
env.allowLocalModels = false;
env.allowRemoteModels = true;

import { evaluateInputCore, normalizeText, getBinaryStance, detectLanguageFRorEN, clearAIEvaluationCaches } from './src/pages/NeuroDeck/hooks/useAIEvaluation.js';
import { DEFAULT_DECK } from './src/data/flashcardData.js';

const testBankPath = path.join(__dirname, 'testBank.json');
const testBank = JSON.parse(fs.readFileSync(testBankPath, 'utf8'));

const testBankMultiPath = path.join(__dirname, 'testBankMulti.json');
const testBankMulti = JSON.parse(fs.readFileSync(testBankMultiPath, 'utf8'));

const allTests = [...testBank, ...testBankMulti];

const questionMap = {};
for (const q of DEFAULT_DECK) {
  questionMap[q.id] = q;
}

const nliModels = [
  { id: "Xenova/nli-deberta-v3-small", name: "DeBERTa-v3 Small" },
  { id: "Xenova/mdeberta-v3-base-xnli-multilingual-nli-2mil7", name: "mDeBERTa-v3 Multilingual" },
  { id: "Xenova/nli-deberta-v3-base", name: "DeBERTa-v3 Base" },
  { id: "Xenova/nli-deberta-v3-large", name: "DeBERTa-v3 Large" }
];

const embeddingModels = [
  { id: "Xenova/all-MiniLM-L6-v2", name: "MiniLM-L6-v2" },
  { id: "Xenova/multilingual-e5-small", name: "Multilingual E5 Small" },
  { id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2", name: "Multilingual Paraphrase L12" },
  { id: "Xenova/all-MiniLM-L12-v2", name: "MiniLM-L12-v2" },
  { id: "Xenova/bge-base-en-v1.5", name: "BGE Base EN" }
];

async function runMatrix() {
  console.log("=== STARTING MODEL MATRIX EVALUATION ===");
  console.log(`Evaluating ${allTests.length} tests across ${nliModels.length} NLI models x ${embeddingModels.length} Embedding models...\n`);

  const resultsMatrix = {};

  for (const nliInfo of nliModels) {
    console.log(`\n--- Loading NLI Model: ${nliInfo.name} (${nliInfo.id}) ---`);
    let nliPipeline = null;
    try {
      nliPipeline = await pipeline("text-classification", nliInfo.id);
    } catch (e) {
      console.error(`Failed to load NLI model ${nliInfo.id}:`, e.message);
      continue;
    }

    const nliModelFunc = async (batchedInputs) => {
      try {
        const out = await nliPipeline(batchedInputs, { top_k: 5, padding: true, truncation: true, max_length: 512 });
        return out;
      } catch(e) {
        return null;
      }
    };

    for (const embInfo of embeddingModels) {
      console.log(`  -> Testing with Embedding Model: ${embInfo.name} (${embInfo.id})...`);
      let embPipeline = null;
      try {
        embPipeline = await pipeline("feature-extraction", embInfo.id);
      } catch (e) {
        console.error(`     Failed to load Embedding model ${embInfo.id}:`, e.message);
        continue;
      }

      const getEmbeddingsFunc = async (texts) => {
        try {
          const out = await embPipeline(texts, { pooling: 'mean', normalize: true });
          const res = [];
          for (let i = 0; i < texts.length; i++) {
            res.push(Array.from(out[i].data));
          }
          return res;
        } catch(e) {
          return null;
        }
      };

      let passedCount = 0;
      let totalCount = allTests.length;
      clearAIEvaluationCaches();

      for (const testCase of allTests) {
        const q = testCase.questionId ? (questionMap[testCase.questionId] || {}) : {};
        const questionObj = {
          ...q,
          choices: testCase.choices || q.choices || []
        };
        const truths = testCase.customTruths || (q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []));

        try {
          const res = await evaluateInputCore(
            testCase.userInput,
            questionObj,
            truths,
            nliModelFunc,
            getEmbeddingsFunc,
            null,
            null,
            detectLanguageFRorEN(testCase.userInput)
          );

          const score = res.score;
          const min = testCase.expectedMin !== undefined ? testCase.expectedMin : (testCase.expectedScore !== undefined ? testCase.expectedScore : 8.0);
          const max = testCase.expectedMax !== undefined ? testCase.expectedMax : 10.0;

          if (score >= min && score <= max) {
            passedCount++;
          } else {
            if (nliInfo.name === "DeBERTa-v3 Small" && embInfo.name === "MiniLM-L6-v2") {
              console.log(`❌ [FAIL] ${testCase.name} -> Score: ${score.toFixed(2)} | Expected: ${min}-${max} (Status: ${res.status})`);
              if (res._debug) {
                console.log(`   └─ Debug: stance=${res._debug.inputStance}/${res._debug.truthStance}, maxEmbSim=${res._debug.maxEmbeddingSim}, maxTokOv=${res._debug.maxTokenOverlap}, maxDist=${res._debug.maxDistractorScore}, hits=${res._debug.hits}`);
              }
            }
          }
        } catch (err) {
          // fail
        }
      }

      const passRatePercent = ((passedCount / totalCount) * 100).toFixed(1);
      const key = `${nliInfo.name} x ${embInfo.name}`;
      resultsMatrix[key] = { passedCount, totalCount, passRatePercent };
      console.log(`     Result for ${key}: ${passedCount}/${totalCount} (${passRatePercent}%)`);
    }
  }

  console.log("\n\n=======================================================");
  console.log("               MODEL EVALUATION MATRIX RESULTS          ");
  console.log("=======================================================\n");
  console.log("| NLI Model | Embedding Model | Passed | Total | Success Rate |");
  console.log("| :--- | :--- | :---: | :---: | :---: |");
  for (const [key, val] of Object.entries(resultsMatrix)) {
    const [nliName, embName] = key.split(' x ');
    console.log(`| ${nliName} | ${embName} | ${val.passedCount} | ${val.totalCount} | **${val.passRatePercent}%** |`);
  }
}

runMatrix().catch(console.error);
