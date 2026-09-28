# Durable demo deployment

EventMesh is a single Next.js container with SQLite. SQLite must live on a persistent volume; the filesystem of an ordinary ephemeral web container is insufficient. The committed `Dockerfile` builds the app, runs migrations and the idempotent seed on startup, then starts Next.js. `/api/health` returns 200 only when the database responds.

## Railway (persistent volume)

1. Create a Railway project from `https://github.com/QuantumArnav/Eventmesh` and let Railway use the root `Dockerfile`.
2. Add a **volume** mounted at `/app/prisma/data`. Do this **before** opening the service to viewers. Mount the data directory only; mounting `/app/prisma` would hide the schema and migrations.
3. Set `DATABASE_URL=file:./data/dev.db`. Leave `OPENAI_API_KEY` unset for the fully functional local text and Smart Search fallback. Add it only through Railway variables if you have a working key; never commit it.
4. Configure `/api/health` as the health-check path. Generate a public domain after the deployment reaches healthy status.
5. Inspect startup logs for the five migrations and seed completion. Open the generated domain and verify `/`, `/discover`, one event detail, Smart Search, `/organizer`, `/organizer/inbox`, `/organizer/create`, `/organizer/scheduling`, `/event-mesh`, and `/demo`.
6. Create a test listing, refresh Discover, then restart/redeploy the service and verify the listing persists. Open its QR code from another device to verify that it points at the public domain.
7. Back up the SQLite volume before later migrations. Keep one running instance: concurrent replicas writing the same SQLite file are outside this prototype's design.

The seed is idempotent and does not intentionally reset existing events or saved preferences. The database file in the image is only for build-time validation; the mounted volume supplies the runtime database. [Railway Dockerfile builds](https://docs.railway.com/builds/dockerfiles) and [Railway volumes](https://docs.railway.com/volumes/reference) are the platform references.

## Render alternative

Render's ordinary filesystem is ephemeral. Use a paid service with a persistent disk mounted at `/app/prisma/data`; then use the same `DATABASE_URL`, Dockerfile, health check, and verification above. Do not use a free ephemeral instance for writable event and inbox features. See [Render persistent disks](https://render.com/docs/disks).

## Security boundary for a public demo

The current hackathon prototype has one shared demo student and no authentication. Anyone who can reach the app can stage sources, read staged content, change demo preferences, and create listings. Protect the public URL with a trusted access layer or share it only with reviewers using disposable demo data. Do not submit private posters, personal messages, or real booking information. This app has no production retention or moderation system.

## Current deployment status

The previously shared `trycloudflare.com` tunnel is temporary and depends on the owner's computer and three local processes. It is not a durable deployment and is not listed as a live demo in the README. Docker could not be built locally because the Docker daemon was not running; [GitHub Actions](https://github.com/QuantumArnav/Eventmesh/actions/runs/36462480659) built the image and verified an event survives container recreation with the same mounted SQLite directory. A hosting account and a verified public production URL are still required.
