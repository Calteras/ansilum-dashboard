# Ask Ansilum (AI assistant)

`/chats` (sidebar "Ask Ansilum", STANDARD plan and up) is the merchant's AI assistant. It talks
only to ansilum-be, which authenticates the user, bills AI units and forwards the question to the
agent service; the browser never sees the agent, provider, model or tokens.

| Piece | File |
|---|---|
| Streaming client (`POST /ai/query/stream`, server-sent events) and `GET /ai/usage` | `src/features/assistant/api/assistant.api.ts`, `sse.ts` |
| Conversation state from the events (text, tools, cards, sources, units) | `src/features/assistant/model/chat-reducer.ts`, `hooks/use-assistant-chat.ts` |
| Page, answer rendering (Markdown subset as React elements, never HTML), cards, composer | `src/features/assistant/index.tsx`, `components/` |
| A2UI surfaces of the data cards (catalog, processor per conversation) | `src/features/assistant/a2ui/` |
| Thinking orb (`thinking-orbs`) and its morph between states | `components/agent-orb.tsx`, `model/orb-morph.ts` |

- **Modes:** Ask (1 unit) and Deep Analysis (5 units; only when `/ai/usage` reports
  `deep_analysis_available`). Costs come from the backend, never from the client.
- **Units:** the badge shows what is left this month for the subscription account; a completed
  answer is charged, a failed, stopped or limit-reached one is not. No units left → 402
  `ai_units_exhausted`, shown before anything runs.
- **Figures** in the cards are the backend's (sales analytics SQL); the text is the model's
  summary of them.
- **Cards as A2UI:** the agent sends each card as an [A2UI](https://a2ui.org) v0.9 surface
  (`ui.a2ui` event, and `answer.a2ui`). Only the Ansilum catalog
  (`https://ansilum.com/a2ui/catalogs/ansilum/v1.json`: `MetricGroup`, `DataTable`) is accepted;
  its zod schemas validate every surface, and a refused surface falls back to the plain card from
  `answer.components`. The schemas import `zod/v3` because A2UI reads zod 3 schema metadata.
- **Thinking orb:** `breathing` while the agent thinks, `working` while a tool runs, `composing`
  once the answer text flows. Each state holds for at least ~1 s and morphs into the next on the
  same canvas (the outgoing dots draw in and fade as the incoming ones bloom out). Reduced motion
  switches without the morph.

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
