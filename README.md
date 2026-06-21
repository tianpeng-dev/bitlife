# Text Life

Mobile-first PWA text life simulator.

## Development

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
npm run build
npm run test:e2e
```

## Netlify

The app deploys with Netlify using `netlify.toml`. Local gameplay is offline-first. Netlify Functions power anonymous tombstone sharing and leaderboard reads.

## Anonymous Leaderboard

The leaderboard is an anonymous, unverified public sharing surface for V1. Netlify Functions validate bounded payload fields and recompute scores from public outcome data, but they do not provide anti-cheat guarantees, accounts, or cloud save authority.

## P1 Expansion

The P1 expansion keeps the app local-first and adds modular systems for assets, romance/family, crime, justice/prison, country law, fame/social media, pets, and travel/migration.

Generated P1 content is validated before runtime. The validation covers schema shape, bilingual locale coverage, id references, numeric bounds, state reachability, and forbidden reference expressions.
