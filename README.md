# Auto Flashcards

Lightweight, local-first flashcard system built on Markdown and Next.js, with robust LaTeX rendering, image handling, and a pluggable scheduler.

- Cards are plain Markdown files with `## Front` and `## Back` sections.
- The web UI (Next.js) lets you study, browse, and edit cards.
- LaTeX is rendered with KaTeX. Inline and display math supported.
- Media files live under `website/public/files/` and are referenced as `files/<name>`.
- XML decks can be converted to Markdown (and blobs resolved) with `xml_to_markdown.py`.

## Features

- Markdown + LaTeX (`$...$`, `\(...\)`, `\[...\]`, `$$...$$`)
- Image/media support via `files/` paths
- Pluggable scheduling algorithms (default SM-2–like)
- Local JSON history storage (no DB)
- Debug modes for card parsing and Markdown rendering

## Requirements

- Node.js 18+
- npm (comes with Node)
- Python 3.9+

## Quick Start

1) Install web dependencies

- cd `website`
- Run `npm install`

2) Start the dev server

- `npm run dev`
- Open http://localhost:3000

3) Add cards

- Put Markdown files in `website/markdown_cards/` (see format below)
- Place images/media in `website/public/files/`

4) Optional: enable debug logging

- `npm run dev:debug` to log parsing/markdown debug info in console

## Card Format

Each card is a single Markdown file with a title and two sections:

```
# Any Title

## Front
What is the L2 norm?

## Back
Also known as the Euclidean norm. $\lVert x \rVert_2 = \sqrt{\sum_i x_i^2}$
```

- You can organize cards into groups by creating subfolders under `website/markdown_cards/`. The UI lets you filter by group.
- LaTeX is supported in both sections:
  - Inline: `$...$` or `\(...\)`
  - Display: `$$...$$` or `\[...\]`
  - Escaped dollars `\$` render as literal `$`.
  - Inline code is protected from math parsing.

## Media / Images

- Put media in `website/public/files/`.
- Reference them from Markdown as `![Alt](files/<filename>)`.
- The site serves them at `/files/<filename>`.

## Converting XML Decks

Use `xml_to_markdown.py` to convert deck XML into Markdown and resolve blobs to files.

Example:

```
python xml_to_markdown.py "ML.xml" --output_dir website/markdown_cards
```

What it does:

- Parses cards from the XML.
- Resolves `{{blob <hash>}}` references:
  - Moves files from `blobs/` (and migrates legacy `files/`) into `website/public/files/<hash>.<ext>`
  - Rewrites `{{blob <hash>}}` to `![Image](files/<hash>.<ext>)` or `[File](files/<hash>.<ext>)`
- Produces Markdown card files with `## Front` and `## Back` sections.

Tip: If `google-fire` is not installed, the script falls back to a simple CLI:

```
python xml_to_markdown.py <deck1.xml> [<deck2.xml> ...]
```

## Scheduler

- Default scheduler lives in `website/src/algorithms/default.ts`.
- Add custom schedulers in `website/src/algorithms/` and register them in `index.ts`.
- API endpoint `/api/next` pulls the next N cards according to the scheduler.

## API Overview (dev)

- `GET /api/cards` – list all cards
- `GET /api/cards/[id]` – get a single card
- `PUT /api/cards/[id]` – update a card (title/front/back)
- `GET /api/next` – get next N cards (scheduler)
- `POST /api/review` – append a review log
- `GET /api/history` – get review logs

## Debugging & Tests

- Dev with extra logs: `npm run dev:debug`
  - Markdown debug: `NEXT_PUBLIC_DEBUG_MD=1`
  - Card parsing debug: `DEBUG_CARDS=1`
- Extractor regression test: `npm run test:cards`
  - Validates that `## Front`/`## Back` extraction captures multi-line sections.

## Project Structure

- `website/` – Next.js web app
  - `src/app/` – routes and API endpoints
  - `src/lib/markdown.ts` – Markdown + KaTeX rendering
  - `src/lib/cards.ts` – card loading and parsing
  - `public/files/` – served media
  - `markdown_cards/` – cards (checked at runtime)
- `xml_to_markdown.py` – XML → Markdown converter with blob resolution

## Notes

- History is stored in `website/data/history.json` (created on first use).
- No external DB or services are required.

## License

No license specified. Ask the author before distribution.

