# User Guide

This guide explains how to set up Auto Flashcards, import decks, write cards, and study with the web UI.

## 1. Install and Run

1) Install Node and npm (Node 18+). Install Python 3.9+.
2) Install website dependencies:
   - `cd website && npm install`
3) Start the app:
   - `npm run dev` (or `npm run dev:debug` for extra logs)
4) Open http://localhost:3000 in your browser.

## 2. Writing Cards

Cards are Markdown files with a title and two sections.

Example card:

```
# Card Title

## Front
State the Cauchy–Schwarz inequality.

## Back
For vectors $x, y$ in an inner product space:
$$\lvert\langle x, y \rangle\rvert \le \lVert x \rVert \cdot \lVert y \rVert$$
```

- Place cards in `website/markdown_cards/`.
- You may create subfolders (e.g., `website/markdown_cards/linear-algebra/`) to group cards.
- The UI supports filtering by group.

### LaTeX Support

- Inline: `$...$` or `\(...\)`
- Display: `$$...$$` or `\[...\]`
- Escaped dollar: `\$` renders as `$`.
- Inline code (`` `...` ``) is protected from math parsing.

### Images and Media

- Put media under `website/public/files/`.
- Reference in Markdown as `![Alt](files/<filename>)`.
- The site serves `/files/<filename>` automatically.

## 3. Importing XML Decks

Use `xml_to_markdown.py` to turn XML decks into Markdown cards.

Basic usage:

```
python xml_to_markdown.py "MyDeck.xml" --output_dir website/markdown_cards/MyDeck
```

```
python xml_to_markdown.py <deck1.xml> [<deck2.xml> ...]
```

## 4. Studying and Reviewing

- Home page queues cards using the selected scheduler.
- Press “Show Answer”, then grade with Again/Hard/Good/Easy.
- The app logs your reviews to `website/data/history.json`.
- Browse Cards: edit titles and Front/Back directly in the UI and preview rendering.

## 5. Scheduling Algorithms

- The default scheduler is SM-2–like.
- Add your own under `website/src/algorithms/` and register in `index.ts`.
- The API `/api/next` uses the active scheduler to pick the next N cards.

## 6. Debugging

- Use `npm run dev:debug` to enable extra logs:
  - Card parsing (`DEBUG_CARDS=1`): prints section extraction info for each card.
  - Markdown rendering (`NEXT_PUBLIC_DEBUG_MD=1`): logs input/output previews to the browser console.
- Test the section extractor:
  - `npm run test:cards` (validates multi-line `## Front`/`## Back` extraction)

## 7. Tips and Conventions

- Keep each card focused; break large topics into multiple cards.
- Prefer short Front prompts with Back explanations, examples, and formulas.
- Use display math (`$$...$$`) for multi-line equations; inline (`$...$`) for short expressions.
- Store large images or attachments under `website/public/files/` and link to them.
