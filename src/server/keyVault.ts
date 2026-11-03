/**
 * Secure Server-Side Key Vault
 * Stores provider API keys in server memory by session ID.
 * Raw API keys are never exposed back to the client browser.
 */

interface SessionKeys {
  gemini?: string;
  groq?: string;
  openai?: string;
  anthropic?: string;
  customEndpoint?: string;
  updatedAt: number;
}

const sessionVault = new Map<string, SessionKeys>();

export function getSessionKeys(sessionId: string): SessionKeys {
  return sessionVault.get(sessionId) || { updatedAt: Date.now() };
}

export function setSessionKey(sessionId: string, provider: 'gemini' | 'groq' | 'openai' | 'anthropic', key: string): void {
  const current = getSessionKeys(sessionId);
  sessionVault.set(sessionId, {
    ...current,
    [provider]: key.trim(),
    updatedAt: Date.now(),
  });
}

export function deleteSessionKey(sessionId: string, provider: 'gemini' | 'groq' | 'openai' | 'anthropic'): void {
  const current = getSessionKeys(sessionId);
  delete current[provider];
  current.updatedAt = Date.now();
  sessionVault.set(sessionId, current);
}

export function getKeyStatus(sessionId: string): {
  hasGemini: boolean;
  hasGroq: boolean;
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  isEnvGeminiAvailable: boolean;
} {
  const keys = getSessionKeys(sessionId);
  const envGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);

  return {
    hasGemini: Boolean(keys.gemini && keys.gemini.length > 5) || envGemini,
    hasGroq: Boolean(keys.groq && keys.groq.length > 5),
    hasOpenAI: Boolean(keys.openai && keys.openai.length > 5),
    hasAnthropic: Boolean(keys.anthropic && keys.anthropic.length > 5),
    isEnvGeminiAvailable: envGemini,
  };
}

export function resolveKeyForProvider(sessionId: string, provider: string): string | undefined {
  const keys = getSessionKeys(sessionId);
  if (provider === 'gemini') {
    return keys.gemini || process.env.GEMINI_API_KEY;
  }
  if (provider === 'groq') {
    return keys.groq || process.env.GROQ_API_KEY;
  }
  if (provider === 'openai') {
    return keys.openai || process.env.OPENAI_API_KEY;
  }
  if (provider === 'anthropic') {
    return keys.anthropic || process.env.ANTHROPIC_API_KEY;
  }
  return undefined;
}
