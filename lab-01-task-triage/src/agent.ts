import type Anthropic from '@anthropic-ai/sdk';
import type { Dispatch } from './dispatcher.js';

export interface RunAgentOpts {
  createMessage: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;
  dispatch: Dispatch;
  tools: Anthropic.Tool[];
  system: string;
  userInput: string;
  model: string;
  maxTurns?: number;
}

export interface RunAgentResult {
  finalText: string;
  turns: number;
}

export async function runAgent(opts: RunAgentOpts): Promise<RunAgentResult> {
  const { createMessage, dispatch, tools, system, userInput, model } = opts;
  const maxTurns = opts.maxTurns ?? 10;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userInput },
  ];

  for (let turn = 1; turn <= maxTurns; turn++) {
    const response = await createMessage({
      model,
      max_tokens: 1024,
      system,
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      return { finalText, turns: turn };
    }

    if (response.stop_reason !== 'tool_use') {
      throw new Error(`unexpected stop_reason: ${response.stop_reason}`);
    }

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      try {
        const out = await dispatch(tu.name, tu.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: typeof out === 'string' ? out : JSON.stringify(out),
        });
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          is_error: true,
          content: err instanceof Error ? err.message : String(err),
        });
      }
    }

    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error(`runAgent: maxTurns (${maxTurns}) exceeded`);
}
