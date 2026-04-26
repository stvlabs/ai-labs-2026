import { describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { runAgent } from '../src/agent.js';

const mkToolUse = (id: string, name: string, input: unknown): Anthropic.ToolUseBlock =>
  ({ type: 'tool_use', id, name, input } as Anthropic.ToolUseBlock);

const mkText = (text: string): Anthropic.TextBlock =>
  ({ type: 'text', text, citations: null } as unknown as Anthropic.TextBlock);

describe('runAgent', () => {
  it('loops through tool_use rounds and returns final text', async () => {
    const scripted: Anthropic.Message[] = [
      {
        id: 'm1', type: 'message', role: 'assistant', model: 'x',
        content: [mkToolUse('t1', 'read_tasks', {})],
        stop_reason: 'tool_use', stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: null, cache_read_input_tokens: null, server_tool_use: null, service_tier: null },
      } as Anthropic.Message,
      {
        id: 'm2', type: 'message', role: 'assistant', model: 'x',
        content: [mkToolUse('t2', 'suggest_next', { task: 'Email accountant', reasoning: 'Overdue' })],
        stop_reason: 'tool_use', stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: null, cache_read_input_tokens: null, server_tool_use: null, service_tier: null },
      } as Anthropic.Message,
      {
        id: 'm3', type: 'message', role: 'assistant', model: 'x',
        content: [mkText('Start with emailing the accountant.')],
        stop_reason: 'end_turn', stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: null, cache_read_input_tokens: null, server_tool_use: null, service_tier: null },
      } as Anthropic.Message,
    ];

    let i = 0;
    const calls: Array<{ name: string; input: unknown }> = [];

    const result = await runAgent({
      createMessage: async () => scripted[i++],
      dispatch: async (name, input) => {
        calls.push({ name, input });
        if (name === 'read_tasks') return 'FIXTURE TASKS CONTENT';
        if (name === 'suggest_next') return { ok: true };
        return null;
      },
      tools: [],
      system: 'you are a triage assistant',
      userInput: 'help me pick what to do now',
      model: 'claude-haiku-4-5-20251001',
      maxTurns: 5,
    });

    expect(result.finalText).toBe('Start with emailing the accountant.');
    expect(calls).toEqual([
      { name: 'read_tasks', input: {} },
      { name: 'suggest_next', input: { task: 'Email accountant', reasoning: 'Overdue' } },
    ]);
    expect(i).toBe(3);
  });

  it('throws if maxTurns is exceeded', async () => {
    const loopingResponse: Anthropic.Message = {
      id: 'm', type: 'message', role: 'assistant', model: 'x',
      content: [mkToolUse('t', 'read_tasks', {})],
      stop_reason: 'tool_use', stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: null, cache_read_input_tokens: null, server_tool_use: null, service_tier: null },
    } as Anthropic.Message;

    await expect(
      runAgent({
        createMessage: async () => loopingResponse,
        dispatch: async () => 'tasks',
        tools: [],
        system: '',
        userInput: 'x',
        model: 'claude-haiku-4-5-20251001',
        maxTurns: 3,
      }),
    ).rejects.toThrow(/maxTurns/);
  });
});
