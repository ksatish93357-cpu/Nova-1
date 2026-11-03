import { useState, useRef, useId } from 'react';
import { Play, RotateCcw, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sigmoid, sigmoidDerivative, dotProduct } from '../../utils/aiMath';

interface TrainingSample {
  input: [number, number];
  target: number;
}

const DATASETS: Record<string, { name: string; description: string; data: TrainingSample[] }> = {
  xor: {
    name: 'XOR Non-Linear Problem',
    description: 'Classic benchmark that requires learning non-linear decision boundaries.',
    data: [
      { input: [0, 0], target: 0 },
      { input: [0, 1], target: 1 },
      { input: [1, 0], target: 1 },
      { input: [1, 1], target: 0 },
    ],
  },
  and: {
    name: 'AND Logic Gate',
    description: 'Linearly separable Boolean logic problem.',
    data: [
      { input: [0, 0], target: 0 },
      { input: [0, 1], target: 0 },
      { input: [1, 0], target: 0 },
      { input: [1, 1], target: 1 },
    ],
  },
  or: {
    name: 'OR Logic Gate',
    description: 'Linearly separable Boolean logic problem.',
    data: [
      { input: [0, 0], target: 0 },
      { input: [0, 1], target: 1 },
      { input: [1, 0], target: 1 },
      { input: [1, 1], target: 1 },
    ],
  },
};

export function TrainingLab() {
  const epochsSliderId = useId();
  const lrSliderId = useId();

  const [selectedDataset, setSelectedDataset] = useState<'xor' | 'and' | 'or'>('xor');
  const [maxEpochs, setMaxEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.4);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

  // Model weights (2-input, 2-hidden, 1-output network)
  const [weights, setWeights] = useState({
    w_h: [
      [0.2, -0.4],
      [0.7, 0.1],
    ],
    b_h: [0.1, -0.2],
    w_out: [0.5, -0.6],
    b_out: 0.1,
  });

  // Inference test
  const [testInputA, setTestInputA] = useState(0);
  const [testInputB, setTestInputB] = useState(1);
  const [testPrediction, setTestPrediction] = useState<number | null>(null);

  const trainingRef = useRef<boolean>(false);

  const startActualTraining = async () => {
    setIsTraining(true);
    setTrainingCompleted(false);
    trainingRef.current = true;
    setCurrentEpoch(0);

    const dataset = DATASETS[selectedDataset].data;

    // Fresh random weights to demonstrate real learning from initialization
    let w_h = [
      [(Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5],
      [(Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5],
    ];
    let b_h = [(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5];
    let w_out = [(Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5];
    let b_out = (Math.random() - 0.5) * 0.5;

    const history: number[] = [];

    for (let epoch = 1; epoch <= maxEpochs; epoch++) {
      if (!trainingRef.current) break;

      let totalLoss = 0;

      // Train over all samples
      for (const sample of dataset) {
        const [x1, x2] = sample.input;
        const target = sample.target;

        // Forward pass
        const z_h1 = x1 * w_h[0][0] + x2 * w_h[1][0] + b_h[0];
        const a_h1 = sigmoid(z_h1);

        const z_h2 = x1 * w_h[0][1] + x2 * w_h[1][1] + b_h[1];
        const a_h2 = sigmoid(z_h2);

        const z_out = a_h1 * w_out[0] + a_h2 * w_out[1] + b_out;
        const y_pred = sigmoid(z_out);

        const error = target - y_pred;
        totalLoss += Math.pow(error, 2);

        // Backward pass
        const delta_out = -error * sigmoidDerivative(z_out);
        const grad_w_out = [delta_out * a_h1, delta_out * a_h2];
        const grad_b_out = delta_out;

        const delta_h1 = delta_out * w_out[0] * sigmoidDerivative(z_h1);
        const delta_h2 = delta_out * w_out[1] * sigmoidDerivative(z_h2);

        // Gradient update
        w_out = [
          w_out[0] - learningRate * grad_w_out[0],
          w_out[1] - learningRate * grad_w_out[1],
        ];
        b_out -= learningRate * grad_b_out;

        w_h[0][0] -= learningRate * delta_h1 * x1;
        w_h[1][0] -= learningRate * delta_h1 * x2;
        b_h[0] -= learningRate * delta_h1;

        w_h[0][1] -= learningRate * delta_h2 * x1;
        w_h[1][1] -= learningRate * delta_h2 * x2;
        b_h[1] -= learningRate * delta_h2;
      }

      const epochMse = totalLoss / dataset.length;
      history.push(epochMse);

      // Periodically update UI every 2 epochs
      if (epoch % 2 === 0 || epoch === maxEpochs) {
        setCurrentEpoch(epoch);
        setLossHistory([...history]);
        setWeights({ w_h, b_h, w_out, b_out });
        await new Promise((r) => setTimeout(r, 16));
      }
    }

    setIsTraining(false);
    setTrainingCompleted(true);
    trainingRef.current = false;
  };

  const stopTraining = () => {
    trainingRef.current = false;
    setIsTraining(false);
  };

  const runTestInference = () => {
    const [x1, x2] = [testInputA, testInputB];
    const { w_h, b_h, w_out, b_out } = weights;

    const a_h1 = sigmoid(x1 * w_h[0][0] + x2 * w_h[1][0] + b_h[0]);
    const a_h2 = sigmoid(x1 * w_h[0][1] + x2 * w_h[1][1] + b_h[1]);
    const y_pred = sigmoid(a_h1 * w_out[0] + a_h2 * w_out[1] + b_out);

    setTestPrediction(y_pred);
  };

  // SVG chart parameters
  const currentLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0.5;
  const maxLoss = lossHistory.length > 0 ? Math.max(0.6, ...lossHistory) : 0.6;

  const points = lossHistory.map((val, idx) => {
    const x = (idx / Math.max(1, maxEpochs)) * 360 + 20;
    const y = 140 - (val / maxLoss) * 120;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5">
      {/* Educational Distinction Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Educational Scope vs Actual Cluster Pretraining:
          </strong>
          This lab runs <span className="underline font-medium">real numerical backpropagation & stochastic gradient descent</span> in your browser runtime for small 2-layer networks. Real multi-billion parameter LLMs (like LLaMA or GPT-4) use thousands of H100 GPUs over several months.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Model Training & Evaluation Studio
          </h3>
          <p className="text-xs text-slate-400">
            Real epoch training loop, loss curves, and post-training inference testing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isTraining ? (
            <button
              onClick={stopTraining}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors"
            >
              Stop Training
            </button>
          ) : (
            <button
              onClick={startActualTraining}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Train Model ({maxEpochs} Epochs)</span>
            </button>
          )}
          <button
            onClick={() => {
              setLossHistory([]);
              setCurrentEpoch(0);
              setTrainingCompleted(false);
              setTestPrediction(null);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            title="Reset Training State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dataset & Hyperparameter Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Target Dataset / Task
          </label>
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="xor">XOR (Non-Linear Boundary)</option>
            <option value="and">AND Logic Gate</option>
            <option value="or">OR Logic Gate</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            {DATASETS[selectedDataset].description}
          </p>
        </div>

        <div>
          <label htmlFor={epochsSliderId} className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
            <span>Epochs: {maxEpochs}</span>
            <span className="font-mono text-cyan-400">{currentEpoch}/{maxEpochs}</span>
          </label>
          <input
            id={epochsSliderId}
            type="range"
            min="20"
            max="300"
            step="10"
            value={maxEpochs}
            onChange={(e) => setMaxEpochs(parseInt(e.target.value, 10))}
            disabled={isTraining}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg mt-2"
          />
        </div>

        <div>
          <label htmlFor={lrSliderId} className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
            <span>Learning Rate: {learningRate}</span>
            <span className="font-mono text-indigo-400">η = {learningRate}</span>
          </label>
          <input
            id={lrSliderId}
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            disabled={isTraining}
            className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg mt-2"
          />
        </div>
      </div>

      {/* Real-time Loss Curve Chart */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 font-semibold">
            Live MSE Loss Curve (Epochs 1 → {maxEpochs})
          </span>
          <span className="text-xs font-mono text-cyan-400">
            Current Loss: <strong className="text-white">{currentLoss.toFixed(4)}</strong>
          </span>
        </div>

        <div className="w-full h-40 flex items-center justify-center relative">
          <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
            {/* Grid lines */}
            <line x1="20" y1="20" x2="380" y2="20" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
            <line x1="20" y1="80" x2="380" y2="80" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
            <line x1="20" y1="140" x2="380" y2="140" stroke="#475569" opacity="0.8" />
            <line x1="20" y1="20" x2="20" y2="140" stroke="#475569" opacity="0.8" />

            {/* Labels */}
            <text x="5" y="25" fill="#64748b" fontSize="9" fontFamily="monospace">max</text>
            <text x="5" y="140" fill="#64748b" fontSize="9" fontFamily="monospace">0.0</text>
            <text x="360" y="155" fill="#64748b" fontSize="9" fontFamily="monospace">E={maxEpochs}</text>

            {/* Line plot */}
            {lossHistory.length > 1 && (
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            )}
          </svg>
        </div>

        {trainingCompleted && (
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-950/30 p-2 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Actual Training Loop Completed! Model weights updated after {currentEpoch} epochs with final MSE Loss {currentLoss.toFixed(4)}.
            </span>
          </div>
        )}
      </div>

      {/* Post-Training Inference Testing Box */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
          Test Trained Model Inference
        </h4>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Input X1:</span>
            <select
              value={testInputA}
              onChange={(e) => setTestInputA(parseInt(e.target.value, 10))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
            >
              <option value="0">0</option>
              <option value="1">1</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Input X2:</span>
            <select
              value={testInputB}
              onChange={(e) => setTestInputB(parseInt(e.target.value, 10))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
            >
              <option value="0">0</option>
              <option value="1">1</option>
            </select>
          </div>
          <button
            onClick={runTestInference}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Compute Inference (ŷ)
          </button>

          {testPrediction !== null && (
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/40 px-3 py-1 rounded-lg">
              <span className="text-slate-400">Prediction:</span>
              <span className="font-mono font-bold text-white text-sm">
                {testPrediction.toFixed(3)}
              </span>
              <span className="text-[11px] text-cyan-300">
                (Binary: {testPrediction > 0.5 ? '1' : '0'})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
