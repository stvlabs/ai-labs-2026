import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config.js';
import { createReadTasks } from './tools/read-tasks.js';
import { createGetCurrentFocus } from './tools/get-current-focus.js';
import { createSuggestNext } from './tools/suggest-next.js';
import { buildDispatcher, TOOL_SCHEMAS } from './dispatcher.js';
import { runAgent } from './agent.js';

const SYSTEM = `You are a task triage assistant.

Your job: help the user pick ONE concrete first-step to do right now.

Workflow:
1. Call get_current_focus to learn today's date, weekday, and time.
2. Call read_tasks to see the task list (markdown — may be in any language).
3. Pick ONE task from an active section (focus / backlog / similar) whose first-step is doable given the current time/weekday. Skip anything that looks completed (struck out, in a "done" section, etc.).
4. Call suggest_next with { task, reasoning }. Short, concrete task statement; one or two sentences of reasoning.
5. After suggest_next returns, reply in plain text: the task + a short nudge. One paragraph max.

Constraints:
- Prefer tasks that can be started in under 15 minutes from now.
- Be direct. No hedging, no lists, no options. ONE task.`;

async function main() {
  const config = loadConfig();
  const client = new Anthropic({ apiKey: config.apiKey });

  const impls = {
    read_tasks: createReadTasks(config.tasksPath),
    get_current_focus: createGetCurrentFocus(),
    suggest_next: createSuggestNext(config.logPath),
  };

  const tools: Anthropic.Tool[] = TOOL_SCHEMAS.map((t, i) =>
    i === TOOL_SCHEMAS.length - 1 ? { ...t, cache_control: { type: 'ephemeral' } } : t,
  );

  console.log('Thinking...\n');

  const result = await runAgent({
    createMessage: (params) => client.messages.create(params) as Promise<Anthropic.Message>,
    dispatch: buildDispatcher(impls),
    tools,
    system: SYSTEM,
    userInput: 'Help me pick what to do right now. Call the tools, then give me one first-step.',
    model: config.model,
    maxTurns: 6,
  });

  console.log(result.finalText);
  console.log(`\n(${result.turns} turns)`);
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
