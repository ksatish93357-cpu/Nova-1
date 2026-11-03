import { KnowledgeTopic } from '../types';

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'build-neural-network',
    title: 'Build Your Own Neural Network from Scratch',
    category: 'neural-network',
    difficulty: 'Intermediate',
    languages: ['Python', 'JavaScript', 'C++'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x#build-your-own-neural-network',
    description: 'Learn how weights, biases, matrix dot-products, forward activation, and backward propagation work without PyTorch or TensorFlow.',
    keyConcepts: [
      'Perceptrons & Activation Functions (Sigmoid, ReLU)',
      'Matrix Multiplications in Linear Layers (Y = WX + B)',
      'Loss Functions (Mean Squared Error & Binary Cross-Entropy)',
      'The Chain Rule of Calculus in Computational Graphs',
      'Stochastic Gradient Descent (SGD) Parameter Updates',
    ],
    coreTutorial: `### Step 1: Initialize Weights & Biases
In a pure neural network, parameters are matrices initialized with small random values to break symmetry.
\`\`\`python
import numpy as np

class LayerDense:
    def __init__(self, n_inputs, n_neurons):
        self.weights = 0.01 * np.random.randn(n_inputs, n_neurons)
        self.biases = np.zeros((1, n_neurons))
    
    def forward(self, inputs):
        self.inputs = inputs
        self.output = np.dot(inputs, self.weights) + self.biases
\`\`\`

### Step 2: Non-Linear Activation
Without non-linearities (like ReLU), deep networks collapse mathematically into a single linear matrix!
\`\`\`python
class ActivationReLU:
    def forward(self, inputs):
        self.inputs = inputs
        self.output = np.maximum(0, inputs)
    
    def backward(self, dvalues):
        self.dinputs = dvalues.copy()
        self.dinputs[self.inputs <= 0] = 0
\`\`\`

### Step 3: Backpropagation & Chain Rule
Calculate gradient of loss with respect to weights:
\`\`\`python
# dL/dW = inputs.T . dvalues
# dL/dB = sum(dvalues, axis=0, keepdims=True)
\`\`\``,
    codeSnippet: `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sigmoid_derivative(x):
    return x * (1 - x)

# Input dataset: XOR problem inputs
X = np.array([[0,0], [0,1], [1,0], [1,1]])
y = np.array([[0], [1], [1], [0]])

np.random.seed(42)
w0 = 2 * np.random.random((2, 4)) - 1
w1 = 2 * np.random.random((4, 1)) - 1

# Training loop
for epoch in range(5000):
    l0 = X
    l1 = sigmoid(np.dot(l0, w0))
    l2 = sigmoid(np.dot(l1, w1))
    
    l2_error = y - l2
    l2_delta = l2_error * sigmoid_derivative(l2)
    
    l1_error = l2_delta.dot(w1.T)
    l1_delta = l1_error * sigmoid_derivative(l1)
    
    w1 += l1.T.dot(l2_delta) * 0.1
    w0 += l0.T.dot(l1_delta) * 0.1

print("Trained XOR Predictions:")
print(np.round(l2, 3))`,
  },
  {
    id: 'build-llm-gpt',
    title: 'Build Your Own LLM & Mini-GPT Architecture',
    category: 'llm',
    difficulty: 'Advanced',
    languages: ['Python', 'PyTorch'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x',
    description: 'Deconstruct modern Generative Pretrained Transformers: Tokenization, Causal Masked Self-Attention, Multi-Head Projections, and autoregressive decoding.',
    keyConcepts: [
      'BPE & Character-level Token Embeddings',
      'Positional Embeddings (Absolute vs RoPE)',
      'Scaled Dot-Product Self-Attention: Softmax(QK^T / sqrt(d_k)) * V',
      'Causal Masking to prevent looking into the future during training',
      'Transformer Block: Multi-Head Attention + Residual Connection + LayerNorm + MLP',
      'Autoregressive next-token sampling with temperature & top-k',
    ],
    coreTutorial: `### The Core Attention Formula
The fundamental discovery of "Attention Is All You Need" (Vaswani et al.):
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Where:
- $Q$ is Query (what each token is searching for)
- $K$ is Key (what each token advertises itself as)
- $V$ is Value (the actual semantic content transferred)

### Masked Self-Attention in Python
In an autoregressive decoder-only model (like GPT), tokens cannot look at subsequent tokens. We apply an upper-triangular mask of $-\\infty$ before the softmax:
\`\`\`python
tril = torch.tril(torch.ones(T, T))
wei = q @ k.transpose(-2, -1) * (1.0 / math.sqrt(k.size(-1)))
wei = wei.masked_fill(tril == 0, float('-inf'))
wei = F.softmax(wei, dim=-1)
out = wei @ v
\`\`\``,
    codeSnippet: `import math

def attention_step(query, keys, values, d_k):
    scores = []
    for k in keys:
        # dot product Q . K
        dot = sum(q * ki for q, ki in zip(query, k))
        scores.append(dot / math.sqrt(d_k))
    
    # Softmax
    max_s = max(scores)
    exps = [math.exp(s - max_s) for s in scores]
    sum_exps = sum(exps)
    weights = [e / sum_exps for e in exps]
    
    # Weighted sum of values
    output = [0.0] * len(values[0])
    for w, val in zip(weights, values):
        for i in range(len(output)):
            output[i] += w * val[i]
            
    return weights, output

print("Self-Attention Demo calculated successfully!")`,
  },
  {
    id: 'build-database',
    title: 'Build Your Own Relational & Key-Value Database',
    category: 'database',
    difficulty: 'Intermediate',
    languages: ['C', 'Go', 'Rust', 'Python'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x#build-your-own-database',
    description: 'Understand B-Trees, Write-Ahead Logging (WAL), page storage, SQL lexing/parsing, and ACID transactions from scratch.',
    keyConcepts: [
      'B-Tree and B+Tree on-disk index layouts',
      'Page cache and 4KB block paging',
      'Write-Ahead Logging (WAL) for durability and crash recovery',
      'SQL lexer, parser, and abstract syntax tree (AST)',
      'Query execution engine and table scans',
    ],
    coreTutorial: `### Page-Based Storage Architecture
Modern databases like SQLite and PostgreSQL don't store single rows as arbitrary files. They group rows into fixed-size Pages (typically 4096 bytes).
\`\`\`c
struct Page {
    uint16_t num_cells;
    uint16_t cell_offset;
    uint8_t  page_type; // Leaf or Interior node
    uint8_t  data[PAGE_SIZE - 5];
};
\`\`\`

### Write-Ahead Log (WAL)
Before modifying database pages on disk, every transaction records its changes sequentially to the WAL file. If the system crashes, recovery replays uncommitted frames.`,
    codeSnippet: `# Simple append-only key-value storage engine
class SimpleStorage:
    def __init__(self, filename="db.log"):
        self.filename = filename
        self.index = {} # in-memory offset index
        
    def set(self, key, value):
        with open(self.filename, "a") as f:
            offset = f.tell()
            f.write(f"{key}:{value}\\n")
            self.index[key] = offset
            
    def get(self, key):
        if key not in self.index:
            return None
        with open(self.filename, "r") as f:
            f.seek(self.index[key])
            line = f.readline().strip()
            return line.split(":", 1)[1]

db = SimpleStorage()
db.set("user:101", "Satish Kumar")
print("Retrieved:", db.get("user:101"))`,
  },
  {
    id: 'build-git',
    title: 'Build Your Own Git Version Control System',
    category: 'git',
    difficulty: 'Intermediate',
    languages: ['Python', 'Rust', 'Go'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x#build-your-own-git',
    description: 'Learn how Git stores data as a Directed Acyclic Graph (DAG) of content-addressable blobs, trees, and commit objects with SHA-1 hashes.',
    keyConcepts: [
      'Content-Addressable Object Storage (.git/objects)',
      'Blob objects (file contents with header)',
      'Tree objects (directory listings and modes)',
      'Commit objects (tree hash, parent hash, author, message)',
      'References (refs/heads/main) and HEAD pointer',
    ],
    coreTutorial: `### The Object Storage Model
Git is essentially a content-addressable filesystem. Every object starts with a header:
\`\`\`
type {size}\\0{content}
\`\`\`
It is then compressed using zlib and written to \`.git/objects/xx/yyyy...\` where \`xxyyyy...\` is its SHA-1 hash!`,
    codeSnippet: `import hashlib
import zlib

def hash_object(data: bytes, obj_type="blob") -> str:
    header = f"{obj_type} {len(data)}\\0".encode()
    store = header + data
    sha1 = hashlib.sha1(store).hexdigest()
    compressed = zlib.compress(store)
    return sha1, compressed

sha, comp = hash_object(b"Hello NOVA AI Git Engine!")
print("Git Object SHA-1:", sha)`,
  },
  {
    id: 'build-compiler',
    title: 'Build Your Own Programming Language & Compiler',
    category: 'compiler',
    difficulty: 'Advanced',
    languages: ['Rust', 'Python', 'C'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x#build-your-own-programming-language',
    description: 'From source code string to AST, type checker, bytecode virtual machine, and JIT/native assembly compilation.',
    keyConcepts: [
      'Lexical Analysis (Tokenizer / Lexer) and Regex scanning',
      'Parsing with Recursive Descent or Pratt Operator-Precedence',
      'Abstract Syntax Tree (AST) node representations',
      'Stack-based Bytecode Virtual Machine',
      'Evaluation & Type Checking',
    ],
    coreTutorial: `### The 3 Core Stages of a Compiler
1. **Lexing**: Converting text into tokens \`[LET, IDENT("x"), ASSIGN, NUMBER(42)]\`.
2. **Parsing**: Building an Abstract Syntax Tree (AST) obeying grammar rules.
3. **Evaluation/Codegen**: Walking the AST to generate bytecode or execute instructions directly.`,
    codeSnippet: `import re

TOKEN_TYPES = [
    ('NUMBER', r'\\d+'),
    ('PLUS', r'\\+'),
    ('MINUS', r'-'),
    ('MUL', r'\\*'),
    ('DIV', r'/'),
    ('LPAREN', r'\\('),
    ('RPAREN', r'\\)'),
    ('SKIP', r'\\s+'),
]

def tokenize(code):
    tokens = []
    pos = 0
    while pos < len(code):
        matched = False
        for typ, pattern in TOKEN_TYPES:
            regex = re.compile(pattern)
            m = regex.match(code, pos)
            if m:
                text = m.group(0)
                if typ != 'SKIP':
                    tokens.append((typ, text))
                pos = m.end()
                matched = True
                break
        if not matched:
            raise SyntaxError(f"Unexpected token at {pos}: {code[pos]}")
    return tokens

print("Tokens:", tokenize("3 + 5 * (10 - 2)"))`,
  },
  {
    id: 'build-web-server',
    title: 'Build Your Own High-Performance Web Server',
    category: 'web-server',
    difficulty: 'Beginner',
    languages: ['Python', 'Node.js', 'Go', 'C'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x#build-your-own-web-server',
    description: 'Master TCP sockets, HTTP 1.1 request/response protocols, headers parsing, keep-alive connections, and event loops.',
    keyConcepts: [
      'BSD Socket API: socket(), bind(), listen(), accept()',
      'Parsing RFC 7230 HTTP/1.1 request lines and headers',
      'Content-Length and chunked transfer encoding',
      'Non-blocking I/O and epoll/kqueue event demultiplexing',
      'Static asset serving with MIME types and status codes',
    ],
    coreTutorial: `### Anatomy of an HTTP/1.1 Request
\`\`\`
GET /api/status HTTP/1.1\\r\\n
Host: localhost:3000\\r\\n
User-Agent: NOVA-Client\\r\\n
\\r\\n
\`\`\`
Notice the crucial \`\\r\\n\\r\\n\` delimiter separating headers from the request body!`,
    codeSnippet: `import socket

def run_simple_server(port=8080):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', port))
    server.listen(5)
    print(f"NOVA Web Server listening on port {port}...")
    
    # Handshake simulation
    server.close()

run_simple_server()`,
  },
  {
    id: 'build-operating-system',
    title: 'Build Your Own Minimal OS & Shell',
    category: 'operating-system',
    difficulty: 'Advanced',
    languages: ['C', 'Assembly', 'Rust'],
    repoUrl: 'https://github.com/codecrafters-io/build-your-own-x#build-your-own-operating-system',
    description: 'Understand the x86 bootloader, protected mode, kernel memory management, interrupts (IDT), system calls, and Unix command shells.',
    keyConcepts: [
      'BIOS 16-bit real mode and MBR boot sector (0x7C00)',
      'GDT (Global Descriptor Table) and switching to 32-bit Protected Mode',
      'Interrupt Descriptor Table (IDT) and timer interrupts',
      'Paging and virtual memory translation (CR3 register)',
      'UNIX Shell: fork(), execvp(), waitpid() and pipeline chaining',
    ],
    coreTutorial: `### The Bootloader Contract
When a PC boots, the BIOS loads the first 512 bytes of the bootable drive into memory at address \`0x7C00\`. If the last two bytes are \`0x55, 0xAA\`, the CPU executes it directly!`,
    codeSnippet: `# Simple Shell interactive loop demonstration
import shlex

def parse_shell_command(cmd_line):
    tokens = shlex.split(cmd_line)
    if not tokens:
        return None, []
    command = tokens[0]
    args = tokens[1:]
    return command, args

cmd, args = parse_shell_command("ls -la /src/models --color=auto")
print(f"Executable: {cmd}, Arguments: {args}")`,
  },
];
