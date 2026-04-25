import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadTasks } from '../src/tools/read-tasks.js';
import { createGetCurrentFocus } from '../src/tools/get-current-focus.js';
import { createSuggestNext } from '../src/tools/suggest-next.js';

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

describe('suggest_next', () => {
  it('appends a JSONL line with task, reasoning, and timestamp', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lab01-'));
    const logPath = join(dir, 'triage-log.jsonl');
    const fixedTs = '2026-04-24T09:30:00.000Z';

    const tool = createSuggestNext(logPath, () => new Date(fixedTs));
    const result = await tool({ task: 'Email accountant', reasoning: 'Overdue per focus section' });

    expect(result.ok).toBe(true);

    const contents = await readFile(logPath, 'utf-8');
    const line = JSON.parse(contents.trim());
    expect(line).toEqual({
      ts: fixedTs,
      task: 'Email accountant',
      reasoning: 'Overdue per focus section',
    });

    await rm(dir, { recursive: true });
  });

  it('rejects empty task with a clear error', async () => {
    const tool = createSuggestNext('/tmp/unused.jsonl');
    await expect(tool({ task: '', reasoning: 'x' })).rejects.toThrow(/task.*required/i);
  });
});
