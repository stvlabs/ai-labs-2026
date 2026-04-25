import { describe, expect, it } from 'vitest';
import { buildDispatcher, TOOL_SCHEMAS } from '../src/dispatcher.js';

describe('dispatcher', () => {
  it('routes tool calls to the matching implementation', async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const dispatch = buildDispatcher({
      read_tasks: async (input) => { calls.push({ name: 'read_tasks', input }); return 'TASKS'; },
      get_current_focus: async () => ({ date: '2026-04-24', weekday: 'Friday', time: '09:30' }),
      suggest_next: async (input) => { calls.push({ name: 'suggest_next', input }); return { ok: true }; },
    });

    expect(await dispatch('read_tasks', {})).toBe('TASKS');
    expect(await dispatch('get_current_focus', {})).toMatchObject({ weekday: 'Friday' });
    expect(await dispatch('suggest_next', { task: 't', reasoning: 'r' })).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
  });

  it('throws on unknown tool name', async () => {
    const dispatch = buildDispatcher({
      read_tasks: async () => '',
      get_current_focus: async () => ({ date: '', weekday: '', time: '' }),
      suggest_next: async () => ({ ok: true }),
    });
    await expect(dispatch('does_not_exist', {})).rejects.toThrow(/unknown tool/i);
  });

  it('exports three tool schemas matching the tool names', () => {
    const names = TOOL_SCHEMAS.map((t) => t.name).sort();
    expect(names).toEqual(['get_current_focus', 'read_tasks', 'suggest_next']);
  });
});
