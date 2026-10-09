# Food delivery frontend

Open **Food Delivery** in the Operations sidebar (`/food-delivery`). The web
workspace requires an active tenant owner/admin membership. Channel sales and
financial adjustment controls are owner-only. The server remains authoritative
for live membership, outlet assignments, subscription policy, capability checks,
and the global delivery flags. No new subscription tier is added.

## Workflow

- **Orders:** outlet-scoped GoFood/GrabFood orders, search, active/preparing/ready
  counts, review states, provider-supported actions, restricted pickup details,
  command outcomes, and operational history. Actions send the displayed order
  version and an idempotency key. Preparation and external inventory
  acknowledgment explicitly explain their inventory effects.
- **Integrations:** provider accounts, server credential references, GoFood
  merchant consent, outlet linking and independent effect flags, item/variant/
  modifier mappings, reviewed provider menu JSON, and durable provider operations.
  Setup checkmarks reflect saved configuration, not certification or full mapping
  coverage. Menus remain separate from the POS catalog.
- **Recovery:** inbox health, blocked/failed event replay after correcting the
  cause, command/operation lookup by UUID, and evidence-based resolution of
  unknown commands. Unknown operations require provider/operator reconciliation;
  there is no server resolution endpoint for them.
- **Channel sales:** half-open UTC reporting intervals of at most 366 days,
  source-separated closed sales, and explicitly recorded delivery adjustments.
  Adjustment totals are combined across delivery providers because that is what
  the backend returns. Recording an adjustment never initiates a refund/payout.

## API and synchronization

`delivery.api.ts` uses the existing `/api` tenant client. That proxy already
targets `/app/terrapos`; do not prepend that path a second time. Management
responses are unwrapped from the normal Nest `{ data, ... }` envelope. Provider
webhooks do not use this client.

The current web app has no socket client. Orders synchronize through REST every
five seconds while the view is active and refetch on reconnect/focus. Each cycle
resumes from the cached server cursor, drains up to twenty 100-order pages, and
merges by ID/version. Filters apply locally so terminal updates are never excluded
from synchronization. Queries are scoped to tenant, user, and outlet. A full page
reload safely rebuilds the order cache from the beginning instead of restoring a
cursor without its corresponding snapshot.

Mutations are never automatically retried. Identical order/financial requests
reuse hashed-input intent keys within the browser session. Provider operations
persist their request key, input, and returned ID per tenant/user/binding in
session storage. Unconfirmed submissions keep the original input locked, and
unknown outcomes require explicit provider verification before preparing a new
operation. Command IDs are remembered per order. Cross-browser history/operation
listing is not provided by the backend; recovery also accepts a known UUID.

Pickup/contact details are fetched only after an explicit reveal, use a mutation
with zero cache retention after unmount/reset, and are never persisted to browser
storage. Connection credentials, provider tokens, raw callbacks, and cost
snapshots are not requested or stored by this feature.

## GoFood OAuth deployment

The backend binds merchant consent to a short-lived HttpOnly cookie. The
authorization request and callback must share the **frontend origin** so that
the browser sends that cookie:

1. Set backend `FOOD_DELIVERY_PUBLIC_ORIGIN` to this frontend's HTTPS origin.
2. Register the exact callback
   `https://<frontend-host>/app/terrapos/webhooks/gofood/<connection-id>/oauth/callback`
   with GoFood.
3. The Vite, Vercel, and Netlify configurations proxy the GoFood webhook prefix
   to the backend, preserving the callback path. Set the production proxy upstream
   appropriately if deploying to a different API host. Use an HTTPS development
   origin/tunnel for real provider consent.

The frontend checks the returned GoFood authorization host and callback origin
before navigating in the same browser. Callback processing is owned by the
backend; its current response is JSON, so return to Food Delivery after consent.
Do not place API secrets in frontend environment variables or the connection form.

Backend migration, feature flags, workers, server secrets, provider sandbox
certification, and a pilot outlet remain deployment prerequisites. This frontend
does not enable them automatically. Disabling a local connection does not pause
the marketplace store.

## Validation

Run `npm run test:run`, `npm run build`, and lint the delivery feature and route.
Delivery tests cover response envelopes and endpoint contracts, tenant isolation,
cursor catch-up and terminal-state recovery, capability checks, stable request
keys, unknown outcome verification, mapping constraints, reporting intervals,
and same-origin OAuth callbacks. Browser checks can use mocked responses; no live
provider account is needed to verify the UI.
