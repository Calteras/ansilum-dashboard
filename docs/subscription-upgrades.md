# Subscription upgrade recovery

The development subscription page was blank because `GET /api/subscriptions/plans` returned `data: []`. The connected development database contained no subscription plan rows. The existing backend seed restored Basic, Standard, and Full using the existing prices; no customer subscriptions or payments were changed.

For a fresh development database, run the backend's subscription seed after migrations with its environment loader. From the backend directory:

```sh
node -e 'require("./scripts/load-env.cjs").loadEnvironment(); require("ts-node/register"); require("./prisma/seed.ts")'
```

The existing seed updates catalog prices as well as inserting missing rows. Use it for development setup; review existing prices before running it against a populated database.

## Checkout behavior

- Prices and features come from the API. Empty/error responses show a recovery action rather than a blank page.
- The current subscription must load successfully. Only owners of the selected business can submit an upgrade, matching the backend guard.
- Only higher tiers are purchasable. Annual checkout shows the entire annual total; savings come from actual prices.
- QRIS, GoPay, BCA, BNI and Mandiri match the backend's supported checkout methods. Card checkout is not offered because the backend does not implement it.
- The returned order ID is stored per account in browser local storage, allowing payment to resume after closing the dialog or reloading. Payment details are fetched from the authenticated order endpoint, including legacy Midtrans response fields.
- Pending orders block another checkout in the same browser. The server remains responsible for preventing duplicate orders across browsers or concurrent requests.
- Confirmed payment refreshes account entitlements. Failures remain retryable and payment status can be refreshed manually.

## Verification

Subscription API, query and component tests cover empty plans, plan-fetch retry, account-status failure, ownership, annual checkout, duplicate submission, payment recovery, failed checkout and confirmed payment. Component tests isolate the dialog portal; the real dialogs were separately checked in desktop and mobile Chrome through Playwright with intercepted test account/payment responses and the live plan catalog. No real charge was made.

A real sandbox transaction and webhook delivery are still required to verify the payment provider end to end. Recovery of an order created before its response was received, or from another browser, needs a backend pending-order lookup endpoint; the current backend only exposes lookup by order ID.
