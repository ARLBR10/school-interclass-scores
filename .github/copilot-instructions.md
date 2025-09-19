# Copilot Instructions — school-interclass-scores

This file contains repository-specific guidance for AI coding agents (Copilot-style) to be immediately productive.

Keep suggestions short and actionable. Prefer small, incremental changes and ask for clarification when intent is ambiguous.

Project snapshot

- Framework: Next.js (App Router) — `app/` directory.
- Backend/DB: Convex (generated helpers in `convex/_generated/`). Server-side Convex functions live outside this repo's generated files.
- Styling: Tailwind + `globals.css` (see `postcss.config.mjs`).

Important files to reference

- `package.json`: dev scripts — use `pnpm dev` / `npm run dev` (uses `next dev --turbopack`).
- `app/layout.tsx`, `app/page.tsx`: entrypoints for UI layout and pages.
- `convex/_generated/`: auto-generated Convex helpers. Do not manually edit these files; regenerate with `npx convex dev`.

Architecture & data flow (concise)

- UI: React components in `app/` (Next App Router). Server Components may be used — check `use client` at top of files.
- Data layer: Client calls Convex functions via generated `convex/_generated/api` utilities. Server functions use `convex/_generated/server` wrappers.
- Runtime: Next handles SSR and routing; Convex is used as the app database/backend. Keep Convex-specific logic inside `convex/` functions and only call them from UI or server-side handlers.

Conventions & patterns

- Generated code: Treat anything under `convex/_generated/` as generated and immutable. Regenerate using `npx convex dev` when schema or functions change.
- TypeScript: Codebase uses TS types (`.tsx`, `tsconfig.json`). Keep exports typed and prefer explicit types for public functions.
- Fonts: Uses `next/font` helpers in `app/layout.tsx` (Geist/Geist Mono variables).

Common tasks & commands

- Run dev server: `pnpm dev` or `npm run dev` (starts Next with Turbopack).
- Build: `pnpm build` or `npm run build`.
- Start production server: `npm start` after build.
- Lint: `npm run lint` (runs `eslint`).
- Regenerate Convex generated code: `npx convex dev` (or follow Convex docs). Avoid committing regenerated files unless intentional.

Editing guidance for AI changes

- Small PRs: Prefer focused changes (one feature/bugfix per PR). Update only the files necessary.
- Tests: There are no repository tests in-tree — if adding behavior, include a minimal manual verification checklist in the PR description.
- Styling: Follow existing CSS in `globals.css` and Tailwind usage.
- Avoid modifying `.next/` or `node_modules/` — these are build artifacts.

Examples (how to call Convex)

- Client-side: use the generated `api` reference (example):
  - `import { api } from '../convex/_generated/api';`
  - `const result = await api.scores.getTopScores.fetch(args);`
- Server-side Convex define pattern (follow generated `server.js` wrappers):
  - `import { mutation } from 'convex/_generated/server';`
  - `export default mutation(async ({ db }, args) => { /* ... */ });`

Merge rules

- If this repo already contains a `.github/copilot-instructions.md`, merge by preserving any human-written notes and appending missing sections above.
- Keep this file concise (20–50 lines). If additions are required, open a PR and explain why.

When unsure

- Ask a short clarifying question instead of guessing intent (e.g., "Should I update Convex functions or only the UI?").

Feedback

- After making edits, prompt the maintainer for a quick manual verification step (local dev run and a spot-check page).

Verification checklist (maintainer)

- Suggest to the maintainer to install dependencies (do not run commands): `pnpm install`.
- Suggest to the maintainer to start the dev server and spot-check the app (do not run commands): `pnpm run dev` (or `npm run dev`).
