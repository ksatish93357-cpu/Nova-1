import test from 'node:test';
import assert from 'node:assert/strict';
import {
  relu,
  sigmoid,
  softmax,
  dotProduct,
  cosineSimilarity,
  meanSquaredError,
  computeAttentionScores,
  trainPerceptronStep,
} from './aiMath';
import {
  getRelevantMemories,
  formatMemoryContext,
  MemoryItem,
} from './memoryManager';

test('relu computes correct non-linear activation', () => {
  assert.equal(relu(5), 5);
  assert.equal(relu(-3), 0);
  assert.equal(relu(0), 0);
});

test('sigmoid squashes numbers into (0, 1) range', () => {
  assert.equal(Math.round(sigmoid(0) * 10) / 10, 0.5);
  assert.ok(sigmoid(10) > 0.99);
  assert.ok(sigmoid(-10) < 0.01);
});

test('softmax outputs sum to 1.0', () => {
  const logits = [2.0, 1.0, 0.1];
  const probs = softmax(logits);
  const sum = probs.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-6);
  assert.ok(probs[0] > probs[1] && probs[1] > probs[2]);
});

test('vector math dotProduct and cosineSimilarity', () => {
  const a = [1, 2, 3];
  const b = [4, 5, 6];
  assert.equal(dotProduct(a, b), 32);

  // Identical vectors should have cosine similarity 1.0
  const sim = cosineSimilarity([2, 4], [2, 4]);
  assert.ok(Math.abs(sim - 1.0) < 1e-6);

  // Orthogonal vectors should have cosine similarity 0.0
  const simOrth = cosineSimilarity([1, 0], [0, 1]);
  assert.ok(Math.abs(simOrth - 0.0) < 1e-6);
});

test('meanSquaredError computes average squared residuals', () => {
  const preds = [2.0, 4.0];
  const targets = [2.0, 2.0]; // diffs: 0, 2 -> squared: 0, 4 -> mean: 2
  assert.equal(meanSquaredError(preds, targets), 2.0);
});

test('computeAttentionScores calculates valid scaled dot-product attention', () => {
  const Q = [
    [1, 0],
    [0, 1],
  ];
  const K = [
    [1, 0],
    [0, 1],
  ];
  const attn = computeAttentionScores(Q, K);
  assert.equal(attn.length, 2);
  assert.equal(attn[0].length, 2);
  const row0Sum = attn[0].reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(row0Sum - 1.0) < 1e-6);
  // Q[0] matches K[0] more than K[1]
  assert.ok(attn[0][0] > attn[0][1]);
});

test('trainPerceptronStep reduces error on iterative training', () => {
  let state = {
    weights: [0.1, -0.2],
    bias: 0.0,
    learningRate: 0.5,
  };
  const input = [1.0, 1.0];
  const target = 1.0;

  // Run 5 iterations
  let lastError = 1.0;
  for (let i = 0; i < 5; i++) {
    const res = trainPerceptronStep(state, input, target);
    state = res.newState;
    lastError = Math.abs(res.error);
  }
  // Target is 1.0, prediction should have moved closer to 1.0
  assert.ok(lastError < 0.5);
});

test('memoryManager filters relevant memories and formats prompt context', () => {
  const sampleMemories: MemoryItem[] = [
    {
      id: 'm1',
      category: 'skill',
      content: 'User loves Python and PyTorch',
      createdAt: 1,
      updatedAt: 1,
      importance: 'medium',
      enabled: true,
    },
    {
      id: 'm2',
      category: 'preference',
      content: 'Prefers Hinglish conversational style',
      createdAt: 2,
      updatedAt: 2,
      importance: 'high',
      enabled: true,
    },
    {
      id: 'm3',
      category: 'project',
      content: 'Building a Rust web server',
      createdAt: 3,
      updatedAt: 3,
      importance: 'low',
      enabled: false, // disabled
    },
  ];

  // Querying about Python should match m1 and high-importance m2
  const relevant = getRelevantMemories(sampleMemories, 'Explain Python tensors');
  assert.ok(relevant.some((m) => m.id === 'm1'));
  assert.ok(relevant.some((m) => m.id === 'm2'));
  // Disabled memory m3 should not be included
  assert.ok(!relevant.some((m) => m.id === 'm3'));

  const contextStr = formatMemoryContext(relevant);
  assert.ok(contextStr.includes('NOVA AI Long-Term Personal Memory'));
  assert.ok(contextStr.includes('Python and PyTorch'));
});
