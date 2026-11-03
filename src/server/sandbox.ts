import { spawn } from 'child_process';
import { transformSync } from 'esbuild';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  language: string;
}

const EXECUTION_TIMEOUT_MS = 4000;
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB limit

/**
 * Executes user code in an isolated child process with strict resource limits.
 * Arbitrary code is NEVER executed in the main server process.
 */
export async function executeCodeIsolated(code: string, language: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  const normalizedLang = language.toLowerCase();

  // 1. TypeScript Handling (Transpile via esbuild, then run in isolated Node child)
  if (normalizedLang === 'typescript' || normalizedLang === 'ts') {
    try {
      const transpiled = transformSync(code, {
        loader: 'ts',
        target: 'es2022',
        format: 'esm',
      });
      return await runNodeChild(transpiled.code, startTime, 'typescript');
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: `TypeScript Compilation Error:\n${err.message || String(err)}`,
        executionTimeMs: Date.now() - startTime,
        language: 'typescript',
      };
    }
  }

  // 2. JavaScript Handling (Run in isolated Node child process)
  if (normalizedLang === 'javascript' || normalizedLang === 'js') {
    return await runNodeChild(code, startTime, 'javascript');
  }

  // 3. Python Handling (Run in isolated python3 child process)
  if (normalizedLang === 'python' || normalizedLang === 'py') {
    return await runPythonChild(code, startTime);
  }

  return {
    success: false,
    output: '',
    error: `Unsupported execution language: "${language}". Supported: python, javascript, typescript.`,
    executionTimeMs: Date.now() - startTime,
    language,
  };
}

/**
 * Spawns an isolated Node.js child process with memory limits and a watchdog timer.
 */
function runNodeChild(code: string, startTime: number, langName: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `nova_exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mjs`);

    try {
      fs.writeFileSync(tempFile, code, 'utf8');
    } catch (writeErr: any) {
      resolve({
        success: false,
        output: '',
        error: `Failed to initialize sandbox worker: ${writeErr.message}`,
        executionTimeMs: Date.now() - startTime,
        language: langName,
      });
      return;
    }

    // Spawn isolated node process with 64MB memory limit
    const child = spawn(process.execPath, [
      '--max-old-space-size=64',
      '--no-warnings',
      tempFile,
    ], {
      timeout: EXECUTION_TIMEOUT_MS,
      env: { PATH: process.env.PATH, NODE_ENV: 'sandbox' },
    });

    let stdout = '';
    let stderr = '';
    let isTerminated = false;

    const timer = setTimeout(() => {
      isTerminated = true;
      child.kill('SIGKILL');
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString();
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString();
      }
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {}

      if (isTerminated) {
        resolve({
          success: false,
          output: stdout.slice(0, MAX_OUTPUT_BYTES),
          error: `Execution timed out (${EXECUTION_TIMEOUT_MS}ms limit exceeded). Possible infinite loop.`,
          executionTimeMs: Date.now() - startTime,
          language: langName,
        });
        return;
      }

      const hasError = exitCode !== 0 || stderr.length > 0;
      resolve({
        success: !hasError,
        output: stdout || (!hasError ? '(Program executed successfully with no standard output)' : ''),
        error: stderr || undefined,
        executionTimeMs: Date.now() - startTime,
        language: langName,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {}
      resolve({
        success: false,
        output: stdout,
        error: `Sandbox execution failed: ${err.message}`,
        executionTimeMs: Date.now() - startTime,
        language: langName,
      });
    });
  });
}

/**
 * Spawns an isolated Python child process with strict timeout and output limits.
 */
function runPythonChild(code: string, startTime: number): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `nova_py_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.py`);

    try {
      fs.writeFileSync(tempFile, code, 'utf8');
    } catch (writeErr: any) {
      resolve({
        success: false,
        output: '',
        error: `Failed to initialize Python sandbox worker: ${writeErr.message}`,
        executionTimeMs: Date.now() - startTime,
        language: 'python',
      });
      return;
    }

    const child = spawn('python3', ['-u', tempFile], {
      timeout: EXECUTION_TIMEOUT_MS,
      env: { PATH: process.env.PATH, PYTHONUNBUFFERED: '1' },
    });

    let stdout = '';
    let stderr = '';
    let isTerminated = false;

    const timer = setTimeout(() => {
      isTerminated = true;
      child.kill('SIGKILL');
    }, EXECUTION_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += chunk.toString();
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += chunk.toString();
      }
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {}

      if (isTerminated) {
        resolve({
          success: false,
          output: stdout.slice(0, MAX_OUTPUT_BYTES),
          error: `Execution timed out (${EXECUTION_TIMEOUT_MS}ms limit exceeded).`,
          executionTimeMs: Date.now() - startTime,
          language: 'python',
        });
        return;
      }

      const hasError = exitCode !== 0;
      resolve({
        success: !hasError,
        output: stdout || (!hasError ? '(Python completed with no standard output)' : ''),
        error: stderr || undefined,
        executionTimeMs: Date.now() - startTime,
        language: 'python',
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (e) {}

      resolve({
        success: false,
        output: '',
        error: `Python 3 runtime is not accessible on this system: ${err.message}`,
        executionTimeMs: Date.now() - startTime,
        language: 'python',
      });
    });
  });
}
