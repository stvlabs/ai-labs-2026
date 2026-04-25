import { appendFile } from 'node:fs/promises';

export interface SuggestNextInput {
  task: string;
  reasoning: string;
}

export interface SuggestNextResult {
  ok: true;
}

export function createSuggestNext(logPath: string, now: () => Date = () => new Date()) {
  return async (input: SuggestNextInput): Promise<SuggestNextResult> => {
    if (!input.task || input.task.trim() === '') {
      throw new Error('task is required');
    }
    const entry = {
      ts: now().toISOString(),
      task: input.task,
      reasoning: input.reasoning,
    };
    await appendFile(logPath, JSON.stringify(entry) + '\n', 'utf-8');
    return { ok: true };
  };
}
