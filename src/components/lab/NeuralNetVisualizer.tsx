import { useState, useId } from 'react';
import { relu, sigmoid, gelu, sigmoidDerivative, dotProduct } from '../../utils/aiMath';
import { Play, RotateCcw, Zap, Sparkles } from 'lucide-react';

export function NeuralNetVisualizer() {
  const x1SliderId = useId();
  const x2SliderId = useId();
  const targetSliderId = useId();
  const lrSliderId = useId();

  // Inputs
  const [x1, setX1] = useState(0.8);
  const [x2, setX2] = useState(0.4);
  const [target, setTarget] = useState(1.0);
  const [learningRate, setLearningRate] = useState(0.2);
  const [activation, setActivation] = useState<'sigmoid' | 'relu' | 'gelu'>('sigmoid');

  // Weights
  const [w1, setW1] = useState(0.5); // x1 -> h1
  const [w2, setW2] = useState(-0.3); // x2 -> h1
  const [b1, setB1] = useState(0.1);
  const [w3, setW3] = useState(0.7); // x1 -> h2
  const [w4, setW4] = useState(0.2); // x2 -> h2
  const [b2, setB2] = useState(-0.1);

  // Hidden to output
  const [w5, setW5] = useState(0.6); // h1 -> y
  const [w6, setW6] = useState(-0.5); // h2 -> y
  const [b3, setB3] = useState(0.05);

  const [lastGradients, setLastGradients] = useState<string | null>(null);
  const [stepCount, setStepCount] = useState(0);

  // Forward Pass
  const actFn = (val: number) => {
    if (activation === 'relu') return relu(val);
    if (activation === 'gelu') return gelu(val);
    return sigmoid(val);
  };

  const z_h1 = x1 * w1 + x2 * w2 + b1;
  const a_h1 = actFn(z_h1);

  const z_h2 = x1 * w3 + x2 * w4 + b2;
  const a_h2 = actFn(z_h2);

  const z_y = a_h1 * w5 + a_h2 * w6 + b3;
  const y_pred = sigmoid(z_y); // standard sigmoid output for (0, 1) probability

  const error = target - y_pred;
  const loss = 0.5 * Math.pow(error, 2); // MSE

  // Backpropagation step
  const handleBackpropStep = () => {
    // dLoss/dy_pred = -(target - y_pred)
    // dy_pred/dz_y = y_pred * (1 - y_pred)
    const delta_y = -error * sigmoidDerivative(z_y);

    // Gradients for output layer
    const dW5 = delta_y * a_h1;
    const dW6 = delta_y * a_h2;
    const dB3 = delta_y;

    // Backprop to hidden layer
    const delta_h1 = delta_y * w5 * (activation === 'sigmoid' ? sigmoidDerivative(z_h1) : 1);
    const delta_h2 = delta_y * w6 * (activation === 'sigmoid' ? sigmoidDerivative(z_h2) : 1);

    const dW1 = delta_h1 * x1;
    const dW2 = delta_h1 * x2;
    const dB1 = delta_h1;

    const dW3 = delta_h2 * x1;
    const dW4 = delta_h2 * x2;
    const dB2 = delta_h2;

    // Update weights via Gradient Descent (w = w - lr * grad)
    setW5((prev) => prev - learningRate * dW5);
    setW6((prev) => prev - learningRate * dW6);
    setB3((prev) => prev - learningRate * dB3);

    setW1((prev) => prev - learningRate * dW1);
    setW2((prev) => prev - learningRate * dW2);
    setB1((prev) => prev - learningRate * dB1);

    setW3((prev) => prev - learningRate * dW3);
    setW4((prev) => prev - learningRate * dW4);
    setB2((prev) => prev - learningRate * dB2);

    setStepCount((prev) => prev + 1);
    setLastGradients(
      `Δw5: ${(-learningRate * dW5).toFixed(4)}, Δw6: ${(-learningRate * dW6).toFixed(4)}`
    );
  };

  const handleReset = () => {
    setX1(0.8);
    setX2(0.4);
    setTarget(1.0);
    setW1(0.5);
    setW2(-0.3);
    setB1(0.1);
    setW3(0.7);
    setW4(0.2);
    setB2(-0.1);
    setW5(0.6);
    setW6(-0.5);
    setB3(0.05);
    setStepCount(0);
    setLastGradients(null);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Interactive 2-Layer Neural Network & Backprop
          </h3>
          <p className="text-xs text-slate-400">
            Real forward-pass arithmetic & Chain Rule gradient descent updates in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackpropStep}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Step Backprop ({stepCount})</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Network Computation Graph Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        {/* Layer 1: Inputs */}
        <div className="flex flex-col justify-around gap-4">
          <div className="text-center font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Input Layer
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-center shadow">
            <span className="text-xs font-mono text-cyan-400 font-bold">Neuron X₁</span>
            <div className="text-xl font-mono font-bold text-white my-1">{x1.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400">w1={w1.toFixed(2)} | w3={w3.toFixed(2)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-center shadow">
            <span className="text-xs font-mono text-cyan-400 font-bold">Neuron X₂</span>
            <div className="text-xl font-mono font-bold text-white my-1">{x2.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400">w2={w2.toFixed(2)} | w4={w4.toFixed(2)}</div>
          </div>
        </div>

        {/* Layer 2: Hidden */}
        <div className="flex flex-col justify-around gap-4">
          <div className="text-center font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Hidden Layer ({activation.toUpperCase()})
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-center shadow">
            <span className="text-xs font-mono text-indigo-300 font-bold">Hidden H₁</span>
            <div className="text-xs text-slate-400 font-mono">z = {z_h1.toFixed(3)}</div>
            <div className="text-xl font-mono font-bold text-indigo-200 my-1">{a_h1.toFixed(3)}</div>
            <div className="text-[11px] text-slate-400">out weight w5={w5.toFixed(2)}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-center shadow">
            <span className="text-xs font-mono text-indigo-300 font-bold">Hidden H₂</span>
            <div className="text-xs text-slate-400 font-mono">z = {z_h2.toFixed(3)}</div>
            <div className="text-xl font-mono font-bold text-indigo-200 my-1">{a_h2.toFixed(3)}</div>
            <div className="text-[11px] text-slate-400">out weight w6={w6.toFixed(2)}</div>
          </div>
        </div>

        {/* Layer 3: Output */}
        <div className="flex flex-col justify-center gap-4">
          <div className="text-center font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Output Layer
          </div>
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center shadow">
            <span className="text-xs font-mono text-emerald-400 font-bold">Prediction ŷ</span>
            <div className="text-3xl font-mono font-black text-emerald-300 my-1">
              {y_pred.toFixed(3)}
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Target: <span className="font-bold text-white">{target.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-xs font-mono text-amber-400 bg-amber-950/30 py-1 rounded">
              MSE Loss: {loss.toFixed(4)}
            </div>
          </div>
          {lastGradients && (
            <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 p-2 rounded text-center">
              Last Update: {lastGradients}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls & Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-800 text-xs">
        <div>
          <label htmlFor={x1SliderId} className="flex justify-between text-slate-300 mb-1">
            <span>Input X₁</span>
            <span className="font-mono text-cyan-400">{x1.toFixed(2)}</span>
          </label>
          <input
            id={x1SliderId}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={x1}
            onChange={(e) => setX1(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor={x2SliderId} className="flex justify-between text-slate-300 mb-1">
            <span>Input X₂</span>
            <span className="font-mono text-cyan-400">{x2.toFixed(2)}</span>
          </label>
          <input
            id={x2SliderId}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={x2}
            onChange={(e) => setX2(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor={targetSliderId} className="flex justify-between text-slate-300 mb-1">
            <span>Target Output (y)</span>
            <span className="font-mono text-emerald-400">{target.toFixed(2)}</span>
          </label>
          <input
            id={targetSliderId}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={target}
            onChange={(e) => setTarget(parseFloat(e.target.value))}
            className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor={lrSliderId} className="flex justify-between text-slate-300 mb-1">
            <span>Learning Rate (η)</span>
            <span className="font-mono text-indigo-400">{learningRate.toFixed(2)}</span>
          </label>
          <input
            id={lrSliderId}
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/60 text-xs">
        <span className="text-slate-400 font-medium">Activation Function:</span>
        {(['sigmoid', 'relu', 'gelu'] as const).map((fn) => (
          <button
            key={fn}
            onClick={() => setActivation(fn)}
            className={`px-2.5 py-1 rounded font-mono uppercase text-[11px] transition-colors ${
              activation === fn
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            {fn}
          </button>
        ))}
      </div>
    </div>
  );
}
