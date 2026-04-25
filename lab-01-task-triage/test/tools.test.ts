import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadTasks } from '../src/tools/read-tasks.js';
import { createGetCurrentFocus } from '../src/tools/get-current-focus.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, 'fixtures/tasks.md');

describe('read_tasks', () => {
  it('returns the full content of the tasks file', async () => {
    const tool = createReadTasks(FIXTURE);
    const result = await tool({});
    const expected = await readFile(FIXTURE, 'utf-8');
    expect(result).toBe(expected);
  });

  it('throws a clear error when file is missing', async () => {
    const tool = createReadTasks('/nonexistent/tasks.md');
    await expect(tool({})).rejects.toThrow(/ENOENT|no such file/i);
  });
});

describe('get_current_focus', () => {
  it('returns date, weekday, and time for an injected clock', async () => {
    // 2026-04-24 is a Friday
    const fixed = new Date('2026-04-24T09:30:00+03:00');
    const tool = createGetCurrentFocus(() => fixed);
    const result = await tool({});

    expect(result.date).toBe('2026-04-24');
    expect(result.weekday).toBe('Friday');
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });
});
