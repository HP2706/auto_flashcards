Auto Flashcards (Markdown + Next.js)

Overview

- Reads flashcards from `../markdown_cards/` with sections `## Front` and `## Back`.
- Stores review history in `website/data/history.json`.
- Exposes a pluggable scheduler interface (`src/lib/types.ts`) with a default SM-2–like algorithm (`src/algorithms/default.ts`).
- Minimal study UI with Show Answer + grading buttons.

Getting Started

- Install deps: `npm install`
- One-step dev (auto-open): `npm run dev:open`
- Or manual: `npm run dev` then open `http://localhost:3000`

Folder Structure

- `markdown_cards/`: your markdown cards (inside website/)
- `public/files/`: images and other media referenced by cards
- `src/app/`: Next.js App Router pages and API routes
  - `api/cards`: list cards; `api/cards/[id]`: get one
  - `api/next`: get next N cards via scheduler
  - `api/review`: append a review log
- `src/lib/`: card parsing, history storage, shared types
- `src/algorithms/`: scheduling algorithms and registry

Card Format

Example:

```
# Card 1

## Front
What is L2 norm?

## Back
Also known as Euclidean norm. ||x||₂ = √(Σxᵢ²)
```

Writing a Custom Scheduler

1) Create a file under `src/algorithms/your_algo.ts` that exports a `Scheduler`:

```
import { Scheduler } from "@/lib/types";

const yourAlgo: Scheduler = {
  name: "your-algo",
  description: "My custom picking strategy",
  pickNext: (count, ctx) => {
    return ctx.cards.slice(0, count).map((c) => c.id);
  },
};

export default yourAlgo;
```

2) Register it in `src/algorithms/index.ts`.

Notes

- Uses Node built-ins; no DB required.
- History is append-only JSON at `website/data/history.json`.
- Groups: create subfolders under `website/markdown_cards/` to categorize; the UI lets you filter by group.
- Media: put images in `website/public/files/` and reference them as `files/your.png` in markdown.
