import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'app_storage.json');

export interface AppDatabase {
  sessions: any[];
  memories: any[];
  projects: any[];
  bookmarks: string[];
  settings: Record<string, any>;
  updatedAt: number;
}

const DEFAULT_DB: AppDatabase = {
  sessions: [],
  memories: [],
  projects: [],
  bookmarks: ['build-neural-network', 'build-llm-gpt'],
  settings: {
    languageMode: 'auto',
    selectedModel: 'gemini-3.8-flash',
    memoryEnabled: true,
  },
  updatedAt: Date.now(),
};

function ensureDbFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

export function readDatabase(): AppDatabase {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read storage file, using defaults:', err);
    return DEFAULT_DB;
  }
}

export function writeDatabase(data: Partial<AppDatabase>): AppDatabase {
  ensureDbFile();
  try {
    const current = readDatabase();
    const updated: AppDatabase = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    console.error('Failed to write database file:', err);
    return DEFAULT_DB;
  }
}
