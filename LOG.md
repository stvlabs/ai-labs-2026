# AI-labs: Learning Log

One entry per completed lab. Format: what I learned / what surprised me / what I'd do differently.

Technical specs and code for individual labs live in subfolders `lab-N-*/`.

---

## Lab 1 — Task Triage CLI Agent (2026-04-26)

**Repo:** https://github.com/stvlabs/ai-labs-2026/tree/main/lab-01-task-triage
**Tag:** `lab-1-done`

**What I learned:**
- "Agent" = `messages.create` in a loop until `stop_reason === 'end_turn'`. No special abstraction — just plumbing.
- Tool use is a protocol: model emits `tool_use` blocks, host executes them, results go back as a `user` message. Conversation always alternates user/assistant/user/assistant.
- Tool schemas (what Claude sees) and tool implementations (what runs) are separate. The schema's `description` is what Claude uses to decide *when* to call a tool.

**What surprised me:**
- The dispatcher is just a switch: `name → function`. JSON Schema describes the tool to Claude — that's the entire interface.
- Prompt caching: one `cache_control: ephemeral` line caches the system + tools block across loop turns. 5-min TTL — plenty for one run. A 3-turn run pays full price once, cache-read price for turns 2 and 3.
- Models are stateless — every API call ships the entire conversation history. The host is the memory.
- Errors are sent back as tool results (`is_error: true`). Claude sees the error and can recover.

**What I'd do differently:**
- Always include a `maxTurns` safety belt. Without it a misbehaving model loops forever and bills you to death.
- Use dependency injection for the agent loop (`createMessage` + `dispatch` as params). Tests stay fast and don't hit the real API.

**Time spent:** ~2h, 1 session.
