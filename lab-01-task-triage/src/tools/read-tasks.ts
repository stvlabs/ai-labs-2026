import { readFile } from 'node:fs/promises';

export function createReadTasks(tasksPath: string) {
  return async (_input: Record<string, never>): Promise<string> => {
    return readFile(tasksPath, 'utf-8');
  };
}
