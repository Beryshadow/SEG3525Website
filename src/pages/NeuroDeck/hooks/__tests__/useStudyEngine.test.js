import assert from 'assert';
import { 
  applyFocusModeFilter, 
  applyQuestionTypeFilter, 
  applyProportionalDeficit, 
  getSemanticallyPrioritizedCardIndex, 
  getDueCards 
} from '../useStudyEngine.js';

import { cosineSimilarity } from '../../../../utilities/shared.jsx';

// 1. Test Focus Mode Filter
const deckFocus = [
  { id: '1', question: 'Q1' },
  { id: '2', question: 'Q2' },
  { id: '3', question: 'Q3' }
];
const embeddings = {
  '1': [1, 0, 0],
  '2': [0.9, 0, 0], // Highly similar to 1
  '3': [0, 1, 0]  // Not similar to 1
};

const focusResultThreshold = applyFocusModeFilter(deckFocus, { active: true, focalNodeId: '1', mode: 'threshold', threshold: 0.8 }, embeddings);
assert.strictEqual(focusResultThreshold.length, 2);
assert.strictEqual(focusResultThreshold[0].id, '1');
assert.strictEqual(focusResultThreshold[1].id, '2');

// 2. Test Question Type Filter
const deckTypes = [
  { id: '1', type: 'long' },
  { id: '2', type: 'mcq', correctAnswers: ['A', 'B'] }, // multi
  { id: '3', type: 'mcq', correctAnswers: ['A'] } // mcc
];
const typeResult = applyQuestionTypeFilter(deckTypes, { long: true, mcc: false, multi: false });
assert.strictEqual(typeResult.length, 1);
assert.strictEqual(typeResult[0].id, '1');

// 3. Test Proportional Deficit
const deckProp = [
  { id: '1', type: 'long', attempts: 0 },
  { id: '2', type: 'long', attempts: 0 },
  { id: '3', type: 'mcq', correctAnswers: ['A'], attempts: 10 } // MCC has 10 attempts
];
const propResult = applyProportionalDeficit(deckProp, deckProp, { long: true, mcc: true, multi: false, proportional: true });
assert.strictEqual(propResult.length, 2);
assert.strictEqual(propResult[0].type, 'long');

// 4. Test Semantic Priority
const deckSemantic = [
  { id: '1', score: 2, attempts: 2, isMastered: false }, // weak card
  { id: '2', score: 0, attempts: 0, isMastered: false }, // unattempted candidate
  { id: '3', score: 0, attempts: 0, isMastered: false }  // unattempted candidate
];
const embeddingsSemantic = {
  '1': [1, 0], 
  '2': [1, 0], 
  '3': [0, 1]  
};
const lowestScoreCards = [deckSemantic[1], deckSemantic[2]];
const semanticIdx = getSemanticallyPrioritizedCardIndex(deckSemantic, lowestScoreCards, embeddingsSemantic);
assert.strictEqual(semanticIdx, 1);

// 5. Test Due Cards
const deckDue = [
  { id: '1', dueTurn: 0, isMastered: false },
  { id: '2', dueTurn: 5, isMastered: false },
  { id: '3', dueTurn: 0, isMastered: true }
];
const dueResult = getDueCards(deckDue, 2);
assert.strictEqual(dueResult.length, 1);
assert.strictEqual(dueResult[0].id, '1');

console.log('ALL TESTS PASSED SUCCESSFULLY');
