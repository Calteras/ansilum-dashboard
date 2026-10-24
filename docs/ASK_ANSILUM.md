# Ask Ansilum (AI assistant)

`/chats` (sidebar "Ask Ansilum", STANDARD plan and up) is the merchant's AI assistant. It talks
only to ansilum-be, which authenticates the user, bills AI units and forwards the question to the
agent service; the browser never sees the agent, provider, model or tokens.

| Piece | File |
|---|---|
| Streaming client (`POST /ai/query/stream`, server-sent events) and `GET /ai/usage` | `src/features/assistant/api/assistant.api.ts`, `sse.ts` |
| Conversation state from the events (text, tools, cards, sources, units, Stop) | `src/features/assistant/model/chat-reducer.ts` |
| The live session (stream, A2UI processor, draft, panel, page context), outside React | `src/features/assistant/store/assistant-store.ts` |
| History: list, open, rename, delete; saved conversations as chat turns | `api/assistant.queries.ts`, `model/history.ts`, `components/history-list.tsx` |
| Page `/chats` and `/chats/$conversationId`, answer rendering (Markdown subset as React elements, never HTML), cards, composer | `src/features/assistant/index.tsx`, `components/` |
| Side panel, header launcher (⌘J / Ctrl+J), sidebar indicator, "answer ready" notice | `src/features/assistant/shell/` (mounted in `AuthenticatedLayout`) |
| A2UI surfaces of the data cards (catalog) | `src/features/assistant/a2ui/` |
| Thinking orb (`thinking-orbs`) and its morph between states | `components/agent-orb.tsx`, `model/orb-morph.ts` |

- **Modes:** Ask (1 unit) and Deep Analysis (5 units; only when `/ai/usage` reports
  `deep_analysis_available`). Costs come from the backend, never from the client.
- **Units:** the badge shows what is left this month for the subscription account; a completed
  answer is charged, a failed, stopped or limit-reached one is not. No units left → 402
  `ai_units_exhausted`, shown before anything runs.
- **Figures** in the cards are the backend's (sales analytics SQL); the text is the model's
  summary of them.
- **The conversation outlives the page.** It lives in the assistant store, so opening another
  menu never stops or forgets it; the sidebar entry and the header button show an orb while an
  answer runs, and a toast says when it is ready. Closing the tab does not stop it either:
  ansilum-be reads the answer to the end, saves it and charges it only if it completes.
  Reopening the conversation shows "Still answering…" and reloads it every 2.5 s until the
  answer is saved. **Stop** is explicit (`POST /ai/runs/:runId/cancel`): the stream ends with
  `run.cancelled`, the draft so far is kept and no units are charged.
- **History.** `/chats/<id>` names the conversation (reload, back/forward and other devices open
  it from the server). The list on the left (a sheet on phones) shows the user's own
  conversations in this business, grouped by day, with rename and delete. Follow-ups reply to
  the last answer (`parentMessageId`), so the agent continues from exactly that context; a retry
  becomes a sibling of the failed attempt and replaces it. Switching business or signing out
  starts over (the running answer still finishes in its own business).
- **Side panel.** The same conversation beside any page, without blocking it, so a merchant can
  check other menus during an analysis. Pages describe themselves with
  `useAssistantPageContext(pageContextFor({ title, surface, route, span?, outletId? }))`
  (dashboard, analytics, transactions, products, ingredients); the panel sends that as
  `uiContext` (route, surface, `from`/`to`) and `outletId` unless the merchant removes the chip.
  Identifiers and filters only, never data from the screen.
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
