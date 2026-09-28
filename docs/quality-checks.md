# Final quality checks

These checks describe the local hackathon submission, not a hosted deployment.

## Reproducible commands

```bash
npm install
npm run db:setup
npm run lint
npm run typecheck
npm test
npm run evaluate
npm run build
npm audit --audit-level=moderate
```

At the latest local checkpoint, dependency installation, five database migrations and seed, ESLint, TypeScript, 40 unit tests, the offline evaluation, and the production build succeeded. The dependency audit reported no vulnerabilities. The optional OpenAI routes were exercised with a mocked provider; real credentials and real posters were unavailable for a live accuracy check.

## Runtime and interface

- A production server served the organizer dashboard and event page against the local SQLite database.
- The dashboard displayed computed seven-day event count, conflict count, category mix, venue counts, readiness, pressure, and peak event hours.
- An event page displayed its QR code and accessible title. The QR uses the current page URL; a `localhost` URL is only suitable for local demonstration.
- The checked browser session reported no console errors on those pages.
- Smart Search returned stored event records through its server endpoint with the local interpretation fallback. The model response cannot supply event records.

## Accessibility and performance pass

- Main controls use buttons or links with visible text; the QR toggle exposes its expanded state and the SVG has a title.
- Form fields have labels, focus-visible styles are defined, and reduced-motion preferences suppress animation.
- The event feed and profile are loaded once per refresh. Organizer conflict scores are reused across the summary and table. No Redis or additional service is needed for this small demo dataset.
- The interface was checked visually at a desktop viewport. A formal Lighthouse score and assistive-technology audit have **not** been run; no numerical accessibility or performance score is claimed.

## Data and deployment limits

The listing and venue data are illustrative and not an official IIT Hyderabad feed or booking system. Poster bytes and source text are stored in local SQLite for review; this prototype has no production authentication or retention policy. No public deployment was verified.
