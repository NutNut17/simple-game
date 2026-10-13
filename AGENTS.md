# AGENTS.md

## Project
"Simple Games" — a Vite + React 19 + TypeScript + Tailwind v4 kids' English game collection. Animations use `motion/react`, icons `lucide-react`. Deployed to GitHub Pages (`npm run deploy`, base path via `import.meta.env.BASE_URL`).

## Commands
- `npm run dev` — dev server on port 3000
- `npm run lint` — type check (`tsc --noEmit`); run before finishing
- `npm run build` — production build to `dist/` (git-ignored)

## Layout
- `src/App.tsx` — menu, theme selector, and the `GAMES` list (ids `v1`…`v6`); each game renders full-screen.
- `src/constants.ts` — `THEMES` (alphabet, sea, food, tricky): colors, image extension, image names.
- `src/components/` — one component per game (MemoryGame, DetectGame, RevealGame, TrickyGame, FoodSlidesGame).
- `public/themes/<theme>/` — theme images, loaded as `${BASE_URL}themes/<theme>/<name>.<extension>`.
- `public/tricky-image/` — large PNGs for the tricky game.

## Conventions
- Adding a theme image: drop the file in `public/themes/<theme>/` and add its name (no extension) to `images` in `constants.ts`; the file extension is set per theme.
- Adding a game: create a component, add an entry to `GAMES` and a branch in `App.tsx`, and extend the `activeGame` union type.
- Games share a top bar style: `themeConfig.colors.primary`, an EXIT button, title/subtitle.
- Alphabet theme renders letters as text, not images.

## Git and assets
- Images are committed directly (no Git LFS). The tricky PNGs are ~6–8 MB each, so avoid adding more large binaries; prefer SVG.
- Ignored: `node_modules/`, `dist/`, `.env*` (except `.env.example`), `.DS_Store`.
