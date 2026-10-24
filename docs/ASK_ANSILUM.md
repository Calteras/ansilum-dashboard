# Ask Ansilum (AI assistant)

`/chats` (sidebar "Ask Ansilum", STANDARD plan and up) is the merchant's AI assistant. It talks
only to ansilum-be, which authenticates the user, bills AI units and forwards the question to the
agent service; the browser never sees the agent, provider, model or tokens.

| Piece | File |
|---|---|
| Streaming client (`POST /ai/query/stream`, server-sent events) and `GET /ai/usage` | `src/features/assistant/api/assistant.api.ts`, `sse.ts` |
| Conversation state from the events (text, tools, cards, sources, units) | `src/features/assistant/model/chat-reducer.ts`, `hooks/use-assistant-chat.ts` |
| Page, answer rendering (Markdown subset as React elements, never HTML), cards, composer | `src/features/assistant/index.tsx`, `components/` |

- **Modes:** Ask (1 unit) and Deep Analysis (5 units; only when `/ai/usage` reports
  `deep_analysis_available`). Costs come from the backend, never from the client.
- **Units:** the badge shows what is left this month for the subscription account; a completed
  answer is charged, a failed, stopped or limit-reached one is not. No units left → 402
  `ai_units_exhausted`, shown before anything runs.
- **Figures** in the cards are the backend's (sales analytics SQL); the text is the model's
  summary of them.

## Local development

Run the backend (`ansilum-be`, Docker dev stack on `localhost:18068`) and the agent
(`ansilum-ai`, `uv run ansilum-agent serve` on `localhost:8080`), then point this app at the local
API in a git-ignored `.env.development.local`:

```bash
VITE_API_URL=http://localhost:18068/app/terrapos
```

and restart `npm run dev` (the proxy target is read at startup). Sales answers need the business
on the FULL plan; other plans get help answers and stock alerts.

Tests: `npx vitest run src/features/assistant`.
