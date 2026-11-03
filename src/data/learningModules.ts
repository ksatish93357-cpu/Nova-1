import { LearningModule } from '../types';

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'python-ml-basics',
    title: 'Python & Machine Learning Foundations',
    subtitle: 'Vectors, Matrices, Dot Products & Gradient Descent',
    category: 'foundations',
    difficulty: 'Beginner',
    duration: '25 mins',
    hasInteractiveDemo: true,
    description: 'Learn the foundational linear algebra and calculus behind all AI models. Understand how data is represented as multi-dimensional tensors and how gradient descent finds the minimum loss.',
    keyConcepts: [
      '1D Vectors, 2D Matrices, and ND Tensors',
      'Dot products as projection and feature similarity',
      'Loss functions: MSE (Mean Squared Error) and Cross-Entropy',
      'Gradient Descent: weight = weight - learning_rate * dLoss/dWeight',
      'Overfitting, underfitting, and train/validation splits',
    ],
    codeSnippet: `import numpy as np

# Scalar, Vector, Matrix
scalar = 42
vector = np.array([1.5, 2.0, 3.5])
matrix = np.array([[1, 2], [3, 4], [5, 6]])

# Dot Product (Feature Projection)
weights = np.array([0.4, -0.6, 1.2])
features = np.array([1.0, 2.0, 0.5])
prediction = np.dot(weights, features)
print("Neuron Output (Linear):", prediction)`,
  },
  {
    id: 'neural-networks-backprop',
    title: 'Neural Networks & Backpropagation',
    subtitle: 'Computation Graphs, Activation Functions & The Chain Rule',
    category: 'neural_nets',
    difficulty: 'Intermediate',
    duration: '35 mins',
    hasInteractiveDemo: true,
    description: 'Deconstruct how an artificial neural network calculates forward activations and uses the Chain Rule of calculus to compute exact weight gradients.',
    keyConcepts: [
      'Artificial Neurons: z = sum(w_i * x_i) + b',
      'Activation Functions: Sigmoid, ReLU, GELU, and Softmax',
      'Computational Graph and Intermediate Cached Tensors',
      'Backpropagation: dL/dw = dL/dy * dy/dz * dz/dw',
      'Vanishing and Exploding Gradient problems',
    ],
    codeSnippet: `class Neuron:
    def __init__(self, w, b):
        self.w = w
        self.b = b
    
    def forward(self, x):
        self.x = x
        self.z = self.w * x + self.b
        # ReLU activation
        self.a = max(0, self.z)
        return self.a

    def backward(self, dL_da):
        da_dz = 1 if self.z > 0 else 0
        dL_dz = dL_da * da_dz
        dL_dw = dL_dz * self.x
        dL_db = dL_dz
        return dL_dw, dL_db`,
  },
  {
    id: 'tokenizers-embeddings',
    title: 'Tokenizers & Vector Embeddings',
    subtitle: 'From Raw Text to Byte Pair Encoding (BPE) & Semantic Geometry',
    category: 'llm',
    difficulty: 'Intermediate',
    duration: '30 mins',
    hasInteractiveDemo: true,
    description: 'Discover how LLMs transform human language into numeric vectors. Explore subword tokenization with Byte Pair Encoding (BPE) and how semantic relations emerge in high-dimensional vector space.',
    keyConcepts: [
      'Character vs Word vs Subword Tokenization',
      'Byte Pair Encoding (BPE) merge frequency algorithm',
      'Vocabulary size trade-offs (e.g. 50,257 tokens in GPT-2)',
      'Token Embeddings matrix: VocabSize x EmbeddingDim',
      'Vector geometry: "King" - "Man" + "Woman" ≈ "Queen"',
      'Cosine similarity and semantic distance metrics',
    ],
    codeSnippet: `# Demonstration of token vocabulary lookup
vocab = {"hello": 101, "world": 102, "!": 103}
text = "hello world !"
token_ids = [vocab[w] for w in text.split()]
print("Token IDs:", token_ids)

# Embedding Lookup (Matrix indexing)
import numpy as np
embedding_matrix = np.random.randn(200, 16) # 200 words, 16-dim vectors
embedded_tokens = embedding_matrix[token_ids]
print("Shape of embedded sequence:", embedded_tokens.shape)`,
  },
  {
    id: 'transformers-self-attention',
    title: 'Transformers & Self-Attention Deep Dive',
    subtitle: 'Queries, Keys, Values & Multi-Head Scaled Dot-Product Attention',
    category: 'llm',
    difficulty: 'Advanced',
    duration: '45 mins',
    hasInteractiveDemo: true,
    description: 'Master the crown jewel of modern generative AI: the Transformer architecture. Step through the scaled dot-product attention formula: Softmax(QK^T / sqrt(d_k)) * V.',
    keyConcepts: [
      'The intuition: Queries (Search), Keys (Index), Values (Content)',
      'Scaling factor sqrt(d_k) to prevent vanishing gradients in Softmax',
      'Attention matrix heatmaps showing token interaction weights',
      'Multi-Head Attention: allowing parallel focus on grammar, pronouns, and intent',
      'Positional Encodings: injecting sequential token ordering',
      'Residual skip connections and Layer Normalization',
    ],
    codeSnippet: `import numpy as np

def softmax(x):
    e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e_x / e_x.sum(axis=-1, keepdims=True)

def self_attention(Q, K, V):
    d_k = Q.shape[-1]
    # Step 1: MatMul Q and K^T
    scores = np.matmul(Q, K.swapaxes(-1, -2))
    # Step 2: Scale
    scaled_scores = scores / np.sqrt(d_k)
    # Step 3: Softmax attention weights
    weights = softmax(scaled_scores)
    # Step 4: Multiply by Values
    output = np.matmul(weights, V)
    return output, weights`,
  },
  {
    id: 'mini-llm-scratch',
    title: 'Build a Mini LLM from Scratch',
    subtitle: 'End-to-End Decoder-Only Transformer Architecture in Pure Python',
    category: 'llm',
    difficulty: 'Advanced',
    duration: '50 mins',
    hasInteractiveDemo: true,
    description: 'Construct a complete mini-GPT from scratch. Connect token embeddings, positional encodings, multi-head attention blocks, feed-forward MLPs, and autoregressive next-token sampling.',
    keyConcepts: [
      'Decoder-only Transformer topology (GPT family)',
      'Causal masking: hiding future tokens with -inf before softmax',
      'Feed-Forward Network (FFN): Linear -> GELU -> Linear',
      'Final Linear projection head to vocabulary logits',
      'Autoregressive sampling loop: generating token by token',
      'Temperature scaling, Top-K, and Top-P (nucleus) sampling',
    ],
    codeSnippet: `import torch
import torch.nn as nn
import torch.nn.functional as F

class MiniTransformerBlock(nn.Module):
    def __init__(self, n_embd, n_head):
        super().__init__()
        self.attn = nn.MultiheadAttention(n_embd, n_head, batch_first=True)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)
        self.mlp = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd)
        )

    def forward(self, x, mask=None):
        # Pre-LN Transformer block
        norm_x = self.ln1(x)
        attn_out, _ = self.attn(norm_x, norm_x, norm_x, attn_mask=mask)
        x = x + attn_out
        x = x + self.mlp(self.ln2(x))
        return x`,
  },
  {
    id: 'model-training-testing-lab',
    title: 'Model Training, Testing & Evaluation Lab',
    subtitle: 'Live Epochs, Loss Curves, Gradient Updates & Evaluation Metrics',
    category: 'advanced',
    difficulty: 'Intermediate',
    duration: '40 mins',
    hasInteractiveDemo: true,
    description: 'A genuine model training environment. Run live training iterations, observe the training loss drop across epochs, test inference with custom prompts, and compare educational simulation vs real training compute.',
    keyConcepts: [
      'Simulation vs Real Training distinction',
      'Epochs, batch size, and learning rate schedules (warmup & cosine decay)',
      'Cross-Entropy Loss and Perplexity measurement',
      'Validation loss monitoring and early stopping',
      'GPU/TPU compute requirements and quantization (FP16, INT8, INT4)',
    ],
    codeSnippet: `# Live Python training loop structure
def train_model(model, optimizer, dataloader, epochs=5):
    for epoch in range(epochs):
        epoch_loss = 0.0
        for batch_x, batch_y in dataloader:
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        print(f"Epoch {epoch+1}/{epochs} - Loss: {epoch_loss/len(dataloader):.4f}")`,
  },
  {
    id: 'rag-knowledge-bases',
    title: 'RAG (Retrieval-Augmented Generation) & Knowledge Bases',
    subtitle: 'Document Chunking, Vector Databases & Context Injection',
    category: 'advanced',
    difficulty: 'Intermediate',
    duration: '35 mins',
    hasInteractiveDemo: true,
    description: 'Learn how to eliminate AI hallucinations and ground models in proprietary knowledge. Build an end-to-end RAG pipeline from text ingestion to cosine vector search and augmented prompt generation.',
    keyConcepts: [
      'Document chunking strategies (fixed size, sentence, recursive)',
      'Vector databases and approximate nearest neighbor (ANN / HNSW)',
      'Cosine similarity thresholding and top-K retrieval',
      'Augmented Prompt construction with context citations',
      'Evaluation: faithfulness, answer relevancy, and context recall',
    ],
    codeSnippet: `def simple_rag(query, documents, embedding_fn, top_k=2):
    q_vec = embedding_fn(query)
    scores = []
    for doc in documents:
        d_vec = embedding_fn(doc)
        sim = np.dot(q_vec, d_vec) / (np.linalg.norm(q_vec) * np.linalg.norm(d_vec))
        scores.append((sim, doc))
    
    scores.sort(key=lambda x: x[0], reverse=True)
    top_docs = [doc for _, doc in scores[:top_k]]
    
    prompt = f"Answer using only this context:\\n" + "\\n---\\n".join(top_docs) + f"\\n\\nQuestion: {query}"
    return prompt`,
  },
];
