# Traffic analytics + persistence

The demo runs with zero credentials. Adding Supabase turns on durable CRM
records, booked calls and the `/traffic` dashboard.

## 1 — Run the SQL

Open the Supabase SQL editor and run [`supabase_traffic.sql`](supabase_traffic.sql).
It creates `traffic_logs`, `crm_records`, `crm_activity` and `calls`, all with
RLS enabled and no public policies — every read and write goes through a
server-side API route using the service role key.

## 2 — Set the env vars

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

These are deliberately **not** `NEXT_PUBLIC_`. A `NEXT_PUBLIC_` prefix bundles
the value into client JavaScript and ships it to every visitor's browser, which
is the wrong place for a project URL and service role key pair.

## 3 — Where it shows up

- `/traffic` — visitors, unique IPs, live count, 14-day chart, top paths and
  locations, recent hits. Always dark themed, not linked from the nav.
- `/crm` — records, activity log and booked calls survive redeploys once the
  tables exist.
- `/api/health` — reports which layers are actually live.

## Opting yourself out

Run this once in the browser console on the demo domain:

```js
localStorage.setItem('disable_tracking', 'true')
```

The tracker checks that flag before doing anything, tracks once per path per
session, and resolves geo from the IP server-side via `ip-api.com`.

## Degradation

If the tables do not exist yet, Postgres returns `42P01` and the API routes
return empty arrays instead of throwing. The dashboard renders fine before the
SQL is ever run, and the pipeline keeps working with in-memory state.
