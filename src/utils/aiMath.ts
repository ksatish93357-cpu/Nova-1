/**
 * Pure mathematical algorithms and neural network foundations for NOVA AI Learning Lab
 */

export function relu(x: number): number {
  return Math.max(0, x);
}

export function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

export function sigmoid(x: number): number {
  // Clamp to prevent overflow
  const clamped = Math.max(-50, Math.min(50, x));
  return 1 / (1 + Math.exp(-clamped));
}

export function sigmoidDerivative(x: number): number {
  const s = sigmoid(x);
  return s * (1 - s);
}

export function gelu(x: number): number {
  // Approximate GELU as used in modern Transformers (GPT-2/3)
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
}

export function softmax(logits: number[]): number[] {
  if (logits.length === 0) return [];
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((acc, v) => acc + v, 0);
  return exps.map((v) => (sum === 0 ? 1 / logits.length : v / sum));
}

export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export function vectorNorm(v: number[]): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct(a, b) / (normA * normB);
}

export function meanSquaredError(predictions: number[], targets: number[]): number {
  if (predictions.length === 0 || predictions.length !== targets.length) {
    throw new Error('Prediction and target arrays must be non-empty and equal length');
  }
  const sum = predictions.reduce((acc, p, i) => acc + Math.pow(p - targets[i], 2), 0);
  return sum / predictions.length;
}

export function crossEntropyLoss(probabilities: number[], targetIndex: number): number {
  if (targetIndex < 0 || targetIndex >= probabilities.length) {
    throw new Error('Invalid target index for cross entropy');
  }
  const p = Math.max(1e-15, probabilities[targetIndex]);
  return -Math.log(p);
}

/**
 * Scaled Dot-Product Attention
 * Softmax( (Q * K^T) / sqrt(d_k) )
 */
export function computeAttentionScores(Q: number[][], K: number[][]): number[][] {
  const seqLenQ = Q.length;
  const seqLenK = K.length;
  if (seqLenQ === 0 || seqLenK === 0) return [];
  const d_k = Q[0].length;
  const scale = Math.sqrt(d_k) || 1;

  const rawScores: number[][] = [];
  for (let i = 0; i < seqLenQ; i++) {
    const row: number[] = [];
    for (let j = 0; j < seqLenK; j++) {
      row.push(dotProduct(Q[i], K[j]) / scale);
    }
    rawScores.push(softmax(row));
  }
  return rawScores;
}

/**
 * Educational Perceptron training step for single neuron (w1, w2, bias)
 */
export interface PerceptronState {
  weights: number[];
  bias: number;
  learningRate: number;
}

export function trainPerceptronStep(
  state: PerceptronState,
  input: number[],
  target: number
): { newState: PerceptronState; prediction: number; error: number } {
  const z = dotProduct(state.weights, input) + state.bias;
  const prediction = sigmoid(z);
  const error = target - prediction;

  // Gradient: dE/dw_i = -error * sigmoid'(z) * input_i
  const grad = sigmoidDerivative(z) * error;
  const newWeights = state.weights.map((w, i) => w + state.learningRate * grad * input[i]);
  const newBias = state.bias + state.learningRate * grad;

  return {
    newState: {
      ...state,
      weights: newWeights,
      bias: newBias,
    },
    prediction,
    error,
  };
}

/**
 * Basic Educational BPE Tokenizer preview
 */
export function simpleBpeTokenize(
  text: string,
  vocab: Map<string, number>
): { tokens: string[]; tokenIds: number[] } {
  const words = text.toLowerCase().match(/\w+|[^\s\w]/g) || [];
  const tokens: string[] = [];
  const tokenIds: number[] = [];

  for (const word of words) {
    if (vocab.has(word)) {
      tokens.push(word);
      tokenIds.push(vocab.get(word)!);
    } else {
      // Subword split fallback
      for (const char of word) {
        tokens.push(char);
        tokenIds.push(vocab.get(char) ?? 9999);
      }
    }
  }

  return { tokens, tokenIds };
}
