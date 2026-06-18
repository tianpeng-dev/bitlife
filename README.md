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
