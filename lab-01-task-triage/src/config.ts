import 'dotenv/config';

export interface Config {
  apiKey: string;
  tasksPath: string;
  logPath: string;
  model: string;
}

export function loadConfig(): Config {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set. See .env.example.');

  const defaultTasksPath = new URL('../tasks.md', import.meta.url).pathname;
  const tasksPath = process.env.TASKS_PATH ?? defaultTasksPath;

  return {
    apiKey,
    tasksPath,
    logPath: new URL('../triage-log.jsonl', import.meta.url).pathname,
    model: 'claude-haiku-4-5-20251001',
  };
}
