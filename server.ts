import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { executeCodeIsolated } from './src/server/sandbox';
import {
  setSessionKey,
  deleteSessionKey,
  getKeyStatus,
  resolveKeyForProvider,
} from './src/server/keyVault';
import { readDatabase, writeDatabase } from './src/server/storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Safe CORS & Session ID Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Helper to extract session ID from header
function getSessionId(req: Request): string {
  const headerVal = req.headers['x-session-id'];
  if (typeof headerVal === 'string' && headerVal.trim().length > 0) {
    return headerVal.trim();
  }
  return 'default-session-user';
}

function getLanguageInstruction(languageMode?: string): string {
  switch (languageMode) {
    case 'hindi':
      return 'Respond primarily in standard Hindi (हिंदी लिपि - Devanagari) while keeping technical code and terms in English.';
    case 'hinglish':
      return 'Respond in natural, fluent Hinglish (Hindi written in Roman script mixed naturally with English, widely used by Indian tech developers). Example: "Bilkul! Is concept ko step-by-step decode karte hain. Pehle hum vector space samjhenge..." Keep all code snippets in valid English/standard syntax.';
    case 'english':
      return 'Respond in clear, professional, concise English.';
    default:
      return 'Seamlessly detect and respond in the language the user speaks (English, Hindi, or Hinglish). Always feel warm, developer-friendly, and mathematically precise.';
  }
}

// ==========================================
// 1. REAL MULTI-PROVIDER STREAMING CHAT
// ==========================================
app.post('/api/chat', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { messages, model = 'auto', languageMode = 'auto', memoryContext = '' } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  // Set SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const lastUserMsg = messages[messages.length - 1];
  const userPrompt = lastUserMsg?.content || '';
  const langInstruction = getLanguageInstruction(languageMode);

  // Determine provider and model
  let provider = 'gemini';
  let resolvedModel = 'gemini-3.8-flash';

  if (model.startsWith('groq-') || model === 'llama-3.3-70b-versatile') {
    provider = 'groq';
    resolvedModel = model.replace('groq-', '') || 'llama-3.3-70b-versatile';
  } else if (model.startsWith('openai-') || model.startsWith('gpt-')) {
    provider = 'openai';
    resolvedModel = model.replace('openai-', '') || 'gpt-4o';
  } else if (model === 'gemini-3.1-flash-lite') {
    provider = 'gemini';
    resolvedModel = 'gemini-3.1-flash-lite';
  } else if (model === 'gemini-4-argon') {
    provider = 'gemini';
    resolvedModel = 'gemini-4-argon';
  } else if (model === 'auto') {
    // Auto-detect based on context
    if (lastUserMsg.imageUrl) {
      provider = 'gemini';
      resolvedModel = 'gemini-3.8-flash';
    } else {
      // Check which key is available
      const geminiKey = resolveKeyForProvider(sessionId, 'gemini');
      const groqKey = resolveKeyForProvider(sessionId, 'groq');
      const openaiKey = resolveKeyForProvider(sessionId, 'openai');

      if (geminiKey) {
        provider = 'gemini';
        resolvedModel = 'gemini-3.8-flash';
      } else if (groqKey) {
        provider = 'groq';
        resolvedModel = 'llama-3.3-70b-versatile';
      } else if (openaiKey) {
        provider = 'openai';
        resolvedModel = 'gpt-4o';
      } else {
        provider = 'gemini';
        resolvedModel = 'gemini-3.8-flash';
      }
    }
  }

  const apiKey = resolveKeyForProvider(sessionId, provider);

  if (!apiKey || apiKey.trim().length < 6) {
    const errorMsg =
      provider === 'gemini'
        ? 'Gemini API Key is not configured. Please set GEMINI_API_KEY in the AI Studio Secrets panel or add your key in the Model Manager.'
        : `${provider.toUpperCase()} API Key is not configured. Please open Model Manager to configure your key.`;

    res.write(`data: ${JSON.stringify({ error: errorMsg, done: true, modelUsed: resolvedModel })}\n\n`);
    res.end();
    return;
  }

  const systemInstruction = `You are NOVA AI, a world-class personal AI assistant and self-learning AI platform engineer.
Your persona: Highly intelligent, encouraging, mathematically rigorous, and deeply knowledgeable about artificial intelligence, neural networks, machine learning, systems programming (from codecrafters build-your-own-x), and full-stack software development.

Language Policy:
${langInstruction}

Formatting Rules:
- Provide structured, well-formatted Markdown with clear headings (##, ###).
- Use syntax-highlighted code blocks with language identifiers (\`\`\`python, \`\`\`typescript, \`\`\`javascript).
- When explaining AI concepts (self-attention, backprop, embeddings, loss functions), give both intuitive analogies and concrete code.

${memoryContext ? `Personal Context:\n${memoryContext}\n` : ''}`;

  try {
    // 1. Google Gemini Streaming
    if (provider === 'gemini') {
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      let contents: any;
      if (lastUserMsg.imageUrl && lastUserMsg.imageUrl.startsWith('data:image/')) {
        const parts = lastUserMsg.imageUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const base64Data = parts[1];

        contents = {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: userPrompt || 'Analyze this image and explain in technical detail.' },
          ],
        };
      } else {
        const historyContext = messages
          .slice(0, -1)
          .map((m: any) => `${m.role === 'user' ? 'User' : 'NOVA'}: ${m.content}`)
          .join('\n\n');

        contents = historyContext
          ? `[Conversation History]:\n${historyContext}\n\n[Current User Message]:\n${userPrompt}`
          : userPrompt;
      }

      const stream = await client.models.generateContentStream({
        model: resolvedModel,
        contents,
        config: { systemInstruction },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ chunk: text, modelUsed: resolvedModel })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, modelUsed: resolvedModel })}\n\n`);
      res.end();
      return;
    }

    // 2. Groq or OpenAI Compatible Streaming
    const endpoint =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.error?.message || errText;
      } catch (e) {}
      res.write(`data: ${JSON.stringify({ error: `${provider.toUpperCase()} Error (${apiRes.status}): ${parsedErr}`, done: true })}\n\n`);
      res.end();
      return;
    }

    const reader = apiRes.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const rawChunk = decoder.decode(value);
          const lines = rawChunk.split('\n').filter((l) => l.trim().startsWith('data: '));
          for (const line of lines) {
            const dataStr = line.replace(/^data:\s*/, '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                res.write(`data: ${JSON.stringify({ chunk: text, modelUsed: `${provider}:${resolvedModel}` })}\n\n`);
              }
            } catch (e) {}
          }
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, modelUsed: `${provider}:${resolvedModel}` })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error(`Chat streaming error (${provider}):`, err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Stream connection failed', done: true })}\n\n`);
    res.end();
  }
});

// ==========================================
// 2. ISOLATED SECURE CODE EXECUTION RUNNER
// ==========================================
app.post('/api/code/run', async (req: Request, res: Response) => {
  const { code, language = 'javascript' } = req.body;

  if (typeof code !== 'string') {
    res.status(400).json({ error: 'Code string is required' });
    return;
  }

  try {
    const result = await executeCodeIsolated(code, language);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      output: '',
      error: `Sandbox execution failed: ${err.message}`,
      executionTimeMs: 0,
      language,
    });
  }
});

// ==========================================
// 3. REAL IMAGE VISION & UNDERSTANDING
// ==========================================
app.post('/api/image/analyze', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { imageBase64, mimeType = 'image/png', prompt = 'Analyze this image in detail.' } = req.body;

  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }

  const apiKey = resolveKeyForProvider(sessionId, 'gemini');
  if (!apiKey) {
    res.status(400).json({
      error: 'Image analysis requires a Google Gemini API key. Please configure GEMINI_API_KEY in Secrets or Model Manager.',
    });
    return;
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction: 'You are NOVA Vision AI. Provide thorough, technical, structured visual analysis.',
      },
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    console.error('Image analysis error:', err);
    res.status(500).json({ error: err.message || 'Image analysis failed' });
  }
});

// ==========================================
// 4. REAL IMAGE GENERATION
// ==========================================
app.post('/api/image/generate', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const openaiKey = resolveKeyForProvider(sessionId, 'openai');
  const geminiKey = resolveKeyForProvider(sessionId, 'gemini');

  // 1. If OpenAI key is available, use DALL-E 3
  if (openaiKey) {
    try {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error?.message || 'OpenAI image generation failed');
      }

      res.json({
        imageUrl: data.data?.[0]?.url,
        prompt,
        provider: 'OpenAI DALL-E 3',
      });
      return;
    } catch (err: any) {
      res.status(500).json({ error: err.message });
      return;
    }
  }

  // 2. If Gemini key is available, check for Imagen or prompt enhancement
  if (geminiKey) {
    try {
      const client = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      // Try image generation model if permitted
      const response = await (client.models as any).generateImages({
        model: 'imagen-3.0-generate-002',
        prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
      });

      if (response?.generatedImages?.[0]?.image?.imageBytes) {
        const b64 = response.generatedImages[0].image.imageBytes;
        res.json({
          imageUrl: `data:image/jpeg;base64,${b64}`,
          prompt,
          provider: 'Gemini Imagen 3',
        });
        return;
      }
    } catch (geminiErr: any) {
      console.warn('Imagen generation call notice:', geminiErr?.message);
    }
  }

  // Truthful setup message when image generation credentials are missing
  res.status(400).json({
    error: 'Image generation requires a connected OpenAI API key (for DALL-E 3) or a billing-enabled Gemini API key (for Imagen 3). Please configure your key in Model Manager.',
    setupRequired: true,
  });
});

// ==========================================
// 5. SERVER-SIDE KEY VAULT MANAGEMENT
// ==========================================
app.get('/api/keys/status', (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  res.json(getKeyStatus(sessionId));
});

app.post('/api/keys', (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { provider, apiKey } = req.body;

  if (!provider || !apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    res.status(400).json({ error: 'Valid provider and apiKey string are required.' });
    return;
  }

  setSessionKey(sessionId, provider, apiKey);
  res.json({
    success: true,
    message: `${provider} key securely saved in server-side session vault.`,
    status: getKeyStatus(sessionId),
  });
});

app.delete('/api/keys/:provider', (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const provider = req.params.provider as any;
  deleteSessionKey(sessionId, provider);
  res.json({ success: true, status: getKeyStatus(sessionId) });
});

// Test key validity with a real ping to the provider
app.post('/api/models/test-key', async (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    res.status(400).json({ valid: false, error: 'Please enter a valid API key string.' });
    return;
  }

  try {
    if (provider === 'gemini') {
      const testAi = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const response = await testAi.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Say OK',
      });
      res.json({ valid: true, message: `Gemini verified successfully! Response: ${response.text?.trim()}` });
    } else if (provider === 'groq') {
      const resp = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        res.json({ valid: true, message: `Groq key verified! ${data.data?.length || 0} models available.` });
      } else {
        const err = await resp.json();
        res.status(400).json({ valid: false, error: err.error?.message || 'Invalid Groq API key' });
      }
    } else if (provider === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        res.json({ valid: true, message: 'OpenAI key verified successfully!' });
      } else {
        const err = await resp.json();
        res.status(400).json({ valid: false, error: err.error?.message || 'Invalid OpenAI API key' });
      }
    } else {
      res.json({ valid: true, message: `API key saved for ${provider}.` });
    }
  } catch (err: any) {
    res.status(400).json({ valid: false, error: err.message || 'Key validation failed' });
  }
});

// ==========================================
// 6. GITHUB KNOWLEDGE API INTEGRATION
// ==========================================
app.get('/api/github/repo', async (_req: Request, res: Response) => {
  try {
    const ghRes = await fetch('https://api.github.com/repos/codecrafters-io/build-your-own-x', {
      headers: {
        'User-Agent': 'NOVA-AI-Applet',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (ghRes.ok) {
      const data = await ghRes.json();
      res.json({
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        topics: data.topics || [],
        html_url: data.html_url,
        updated_at: data.updated_at,
        isLive: true,
      });
      return;
    }

    res.json({
      name: 'build-your-own-x',
      full_name: 'codecrafters-io/build-your-own-x',
      description: 'Master programming by recreating your favorite technologies from scratch.',
      stars: 320000,
      forks: 30000,
      html_url: 'https://github.com/codecrafters-io/build-your-own-x',
      isLive: false,
    });
  } catch (err: any) {
    res.json({
      name: 'build-your-own-x',
      full_name: 'codecrafters-io/build-your-own-x',
      description: 'Master programming by recreating your favorite technologies from scratch.',
      html_url: 'https://github.com/codecrafters-io/build-your-own-x',
      isLive: false,
    });
  }
});

// Summarize knowledge tutorial using connected AI
app.post('/api/github/summarize', async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { title, description, concepts } = req.body;

  const apiKey = resolveKeyForProvider(sessionId, 'gemini');
  if (!apiKey) {
    res.status(400).json({ error: 'Summarization requires an active AI model key.' });
    return;
  }

  try {
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide an expert engineering synthesis of how to build: "${title}" from codecrafters-io/build-your-own-x.
Key concepts: ${Array.isArray(concepts) ? concepts.join(', ') : ''}
Context: ${description}

Give:
1. Architectural Blueprint
2. Step-by-Step Implementation Strategy
3. Common Pitfalls & Performance Bottlenecks`,
    });

    res.json({ summary: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Summarization failed' });
  }
});

// ==========================================
// 7. PERSISTENT SERVER DATABASE STORAGE
// ==========================================
app.get('/api/storage', (_req: Request, res: Response) => {
  res.json(readDatabase());
});

app.post('/api/storage', (req: Request, res: Response) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Valid JSON body required' });
    return;
  }
  const updated = writeDatabase(data);
  res.json({ success: true, database: updated });
});

// ==========================================
// 8. MODELS REGISTRY
// ==========================================
app.get('/api/models', (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const status = getKeyStatus(sessionId);

  res.json({
    models: [
      {
        id: 'auto',
        name: 'Auto-Routing (NOVA Dynamic)',
        provider: 'nova',
        description: 'Dynamically routes to the best model depending on whether you need coding, vision, or quick conversational turns.',
        contextWindow: '1M Tokens',
        isDefault: true,
        status: 'active',
        tag: 'Recommended',
      },
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        provider: 'gemini',
        description: 'Next-gen flagship multimodal model with deep reasoning and 1M token context.',
        contextWindow: '1M Tokens',
        status: status.hasGemini ? 'active' : 'requires_key',
        tag: status.isEnvGeminiAvailable ? 'Built-in & Free' : 'Gemini AI',
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        provider: 'gemini',
        description: 'Ultra-low-latency model optimized for instant conversational responses.',
        contextWindow: '1M Tokens',
        status: status.hasGemini ? 'active' : 'requires_key',
        tag: 'Speed Champion',
      },
      {
        id: 'gemini-4-argon',
        name: 'Gemini 4 Argon',
        provider: 'gemini',
        description: 'Frontier reasoning powerhouse for extreme math and ML architecture design.',
        contextWindow: '2M Tokens',
        status: status.hasGemini ? 'ready' : 'requires_key',
        tag: 'Ultra Reasoning',
      },
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Groq Llama 3.3 70B',
        provider: 'groq',
        description: 'Open-weights powerhouse running on LPU hardware with 500+ tokens/sec throughput.',
        contextWindow: '128K Tokens',
        status: status.hasGroq ? 'active' : 'requires_key',
        tag: '500+ Tokens/Sec',
      },
      {
        id: 'gpt-4o',
        name: 'OpenAI GPT-4o',
        provider: 'openai',
        description: 'Multimodal omni model from OpenAI with high contextual reasoning.',
        contextWindow: '128K Tokens',
        status: status.hasOpenAI ? 'active' : 'requires_key',
        tag: 'Frontier Omni',
      },
    ],
    status,
  });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'NOVA AI V2', time: Date.now() });
});

// Set up Vite middlewares in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA AI V2 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
