# IlmStation

Gamified Islamic learning, built as a web app. Daily quests, streaks, a Hifz (memorization) mode, duels, and Sadaqah rewards — a system for turning study into a habit.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + TypeScript, file-based routing via TanStack Router)
- Tailwind CSS v4
- shadcn/ui components (Radix primitives)
- TanStack Query for data fetching
- Deployed to Cloudflare Workers via Nitro

## Development

Requires Node.js.

```sh
git clone <this-repository-url>
cd ilmstation
npm install
npm run dev
```

The dev server runs at `http://localhost:3000` by default.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview a production build locally
- `npm run lint` — run ESLint
- `npm run format` — run Prettier

## Project structure

- `src/routes/` — file-based routes (TanStack Router)
- `src/lib/` — shared utilities and state
- `src/components/` — UI components
