# Durable demo deployment

EventMesh is a single Next.js container with SQLite. SQLite must live on a persistent volume; the filesystem of an ordinary ephemeral web container is insufficient. The committed `Dockerfile` builds the app, runs migrations and the idempotent seed on startup, then starts Next.js. `/api/health` returns 200 only when the database responds.

## Railway (persistent volume)

1. Create a Railway project from `https://github.com/QuantumArnav/Eventmesh` and let Railway use the root `Dockerfile`.
2. Add a **volume** mounted at `/app/prisma/data`. Do this **before** opening the service to viewers. Mount the data directory only; mounting `/app/prisma` would hide the schema and migrations.
3. Set `DATABASE_URL=file:./data/dev.db`. For personal accounts, also set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` as private variables; register the deployed HTTPS `/api/auth/callback/google` redirect in Google Cloud. If the proxy reports an internal callback host, set `AUTH_URL` to the public HTTPS origin. Behind a trusted reverse proxy, set `AUTH_TRUST_HOST=true` if Auth.js requires it. Leave `OPENAI_API_KEY` unset for local text and Smart Search fallback. Never commit any secret.
4. Configure `/api/health` as the health-check path. Generate a public domain after the deployment reaches healthy status.
5. Inspect startup logs for the six migrations and seed completion. Open the generated domain and verify `/`, `/discover`, one event detail, Smart Search, `/organizer`, `/organizer/scheduling`, `/event-mesh`, and `/demo` without signing in. `/organizer/inbox` and `/organizer/create` should require an organizer account.
6. Once Google OAuth has been configured and tested, sign in with a test account. Grant that account organizer access through a trusted database operator (`npm run auth:grant-organizer -- account@example.com`), create a test listing, refresh Discover, then restart/redeploy the service and verify the listing persists. Open its QR code from another device to verify that it points at the public domain.
7. Back up the SQLite volume before later migrations. Keep one running instance: concurrent replicas writing the same SQLite file are outside this prototype's design.

The seed is idempotent and does not intentionally reset existing events or saved preferences. The database file in the image is only for build-time validation; the mounted volume supplies the runtime database. [Railway Dockerfile builds](https://docs.railway.com/builds/dockerfiles) and [Railway volumes](https://docs.railway.com/volumes/reference) are the platform references.

## Render alternative

Render's ordinary filesystem is ephemeral. Use a paid service with a persistent disk mounted at `/app/prisma/data`; then use the same `DATABASE_URL`, Dockerfile, health check, and verification above. Do not use a free ephemeral instance for writable event and inbox features. See [Render persistent disks](https://render.com/docs/disks).

## Security boundary for a public demo

The public guide and deterministic `/demo` need no account. Signed-out visitors can keep a device-local schedule in browser storage; it does not sync across browsers or different demo URLs. Account schedules use database-backed Auth.js sessions, and organizer intake and publishing check roles server-side. The Google login flow has not been tested with live credentials; verify it before claiming a production login. The seeded demo profile stays separate from authenticated profiles. Use disposable posters and announcements because inbox content is stored in SQLite without a retention or moderation system. No IIT Hyderabad email-domain restriction is assumed; define and enforce that policy if campus deployment requires it.

## Current deployment status

The previously shared `trycloudflare.com` tunnel is temporary and depends on the owner's computer and three local processes. It is not a durable deployment and is not listed as a live demo in the README. Docker could not be built locally because the Docker daemon was not running; [GitHub Actions](https://github.com/QuantumArnav/Eventmesh/actions/runs/36462480659) built the image and verified an event survives container recreation with the same mounted SQLite directory. A hosting account and a verified public production URL are still required.
