import type Anthropic from '@anthropic-ai/sdk';

export interface ToolImpls {
  read_tasks: (input: Record<string, never>) => Promise<string>;
  get_current_focus: (input: Record<string, never>) => Promise<{ date: string; weekday: string; time: string }>;
  suggest_next: (input: { task: string; reasoning: string }) => Promise<{ ok: true }>;
}

export type Dispatch = (name: string, input: unknown) => Promise<unknown>;

export function buildDispatcher(impls: ToolImpls): Dispatch {
  return async (name, input) => {
    if (!(name in impls)) throw new Error(`unknown tool: ${name}`);
    return (impls as unknown as Record<string, (input: unknown) => Promise<unknown>>)[name](input);
  };
}

export const TOOL_SCHEMAS: Anthropic.Tool[] = [
  {
    name: 'read_tasks',
    description: "Read the user's current tasks file (markdown). Returns the full file content. Use this to see what's on the plate, in backlog, and what's been done.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_current_focus',
    description: 'Get the current date, weekday, and local time. Use this to decide what is time-appropriate (e.g., do not propose business calls on Sunday evening).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'suggest_next',
    description: 'Record your final recommendation for the single first-step the user should take today. Also produces a log entry for later reflection. Call this exactly once, right before you finish.',
    input_schema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Short task statement (one line).' },
        reasoning: { type: 'string', description: 'One or two sentences on why THIS task, THIS first-step.' },
      },
      required: ['task', 'reasoning'],
    },
  },
];
