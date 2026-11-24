# StreetFood

The owner's side of connecting a business to the StreetFood customer platform: connect, choose which
outlets customers see, set their status and hours, and see the platform fees owed. Menu: **Orders →
StreetFood** (`/street-food`). Owners and admins only; the server enforces it too.

Code: `src/features/street-food`. API: ansilum-be `/integrations/streetfood`
(`ansilum-be/docs/streetfood-os/INTEGRATION_CONTRACT.md`). How the two backends and the vehicle
tracking talk: `streetfood-customer-api/docs/HOW_IT_WORKS.md`.

## What the owner does

1. **Connect.** Enter the platform address (https, or http for this computer only). The POS creates a
   private key. A dialog shows it **once**: business ID, key ID, secret, and everything the platform
   operator needs as copy-ready details or as a command. It cannot be dismissed by Escape or a stray
   click, and *Done* waits for "I have saved these details".
2. **Send the details to the StreetFood operator.** The operator registers the business on the
   platform. This is a person on the platform side; the web app never holds the operator token.
3. **Choose outlets.** One switch per outlet. Each card says what customers see right now (open or
   closed, taking orders or not) and names anything that would hide the outlet or stop orders: no map
   coordinates, invalid tax settings, Auto with no opening hours, a mobile vendor whose day is not
   open.
4. **Status and hours.** Auto / Open / Pause / Closed in one tap; weekly hours with copy-to-all and
   overnight support; preparation time, time zone, fixed place or mobile cart (and what a mobile cart
   shares: live, spot only, hidden) under *More settings*.

The page watches the connection and changes by itself, every few seconds while it is settling:

| Shown | Meaning | What the owner does |
|---|---|---|
| Not connected | No active link | Connect |
| Almost ready | Linked, no outlet shown | Switch on an outlet |
| Sending | Waiting for the first delivery | Nothing |
| Waiting for the operator | The platform answers 401: it does not know the key yet | Send the details, or create a new secret |
| Unreachable | The platform address cannot be reached | Check the address |
| Problem | The platform answered with an error | Wait, or contact the operator |
| Delayed | It worked before, now updates are queuing | Nothing, retried automatically |
| Connected | The platform accepted an update | Nothing |

*Create a new secret* and *Disconnect* are behind a confirmation that says what they do. After either,
the operator replaces the credentials on the platform (`PUT /v1/admin/merchants/{id}/link`), so the
dialog offers the details only, not a registration command.

## API calls

All through `tenantFetch` (cookie session, `x-tenant-id`). The overview is one read for the whole screen.

| Screen | Call |
|---|---|
| Everything | `GET /integrations/streetfood/overview` |
| Connect | `POST /integrations/streetfood/link` |
| New secret | `POST /integrations/streetfood/link/rotate-secret` |
| Disconnect | `DELETE /integrations/streetfood/link` |
| Show or hide an outlet | `PUT /integrations/streetfood/outlets/:id/publication` |
| Status, prep time, time zone, type | `PUT /integrations/streetfood/outlets/:id/settings` |
| Opening hours | `PUT /integrations/streetfood/outlets/:id/hours` |
| Fees owed | `GET /integrations/streetfood/fees` (only once connected) |

`tenantFetch` keeps only the error message, not its code. The one place that depends on a message is
"Not found.", which the POS answers to every StreetFood call when `STREETFOOD_ENABLED` is off; the
page shows "StreetFood is not switched on for this POS".

## Local development

Run the POS with `STREETFOOD_ENABLED=true` (and `STREETFOOD_WORKERS_ENABLED=true`,
`STREETFOOD_ENCRYPTION_KEY`) and the platform API next to it; see the platform README. To pre-fill the
platform address, set in `.env.development.local`:

```
VITE_STREETFOOD_PLATFORM_URL=http://localhost:8080
```

The POS address offered to the operator is the origin of `VITE_API_URL`; the owner can change it in the
dialog. A POS running in Docker cannot reach `http://localhost:8080` itself, so run the POS directly or
give the platform an `https` address.

## Tests

`pnpm vitest run src/features/street-food`: the connection states, address and registration rules, outlet
readiness and hours (`street-food.logic.test.ts`), and the owner's flows with the API mocked
(`index.test.tsx`).

## Not in this screen

Cashier order handling (use the POS orders), the vendor's day and GPS (the vendor app), and the
operator's registration of businesses and payment gateways (the platform's operator API).
