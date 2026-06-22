<!-- BEGIN:tanstack-start-agent-rules -->
# This Is TanStack Start

This repo uses TanStack Start with React 19, TanStack Router file routes, Vite, Nitro, and Tailwind CSS 4.
Route files live in `src/routes/` and must export `Route` from `createFileRoute` or `createRootRoute`/`createRootRouteWithContext`.
Do not add Next.js APIs, `next/link`, `next/navigation`, `next/font`, App Router metadata exports, or `page.tsx`/`layout.tsx` route files.
<!-- END:tanstack-start-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->

# Agent Notes For `school-interclass-scores`

## Repo Snapshot

- Package manager: Bun; lockfile is `bun.lock`.
- Frontend: TanStack Start routes in `src/routes/`; router setup is `src/router.tsx` and generated route tree is `src/routeTree.gen.ts`.
- Backend: Convex code in `convex/`; current schema tables are `matches`, `teams`, and `players`.
- Styling: Tailwind CSS 4 plus shadcn `radix-rhea`, with tokens and app CSS in `src/styles.css`.
- App shell: `src/routes/__root.tsx` wraps pages with `ConvexProvider`, `Header`, `Footer`, and TanStack devtools.
- Product goal: public viewer for interclass scores, matches, teams, players, and related school data.

## Commands

- Install: `bun install`.
- Full dev stack: `bun --bun run dev` starts Vite on port 3000 and `convex dev` concurrently.
- Frontend only: `bun --bun run vite:dev`.
- Convex only: `bun --bun run convex:dev`.
- Production build: `bun --bun run vite:build`.
- Preview built frontend: `bun --bun run vite:preview`.
- Tests: `bun --bun run test`; there are no test files in the repo yet.
- Focused Vitest once tests exist: `bun --bun run test -- src/path/file.test.ts`.
- Lint/format check: `bun --bun run check` runs `oxfmt --check && oxlint`.
- Auto-format/fix: `bun --bun run format` runs `oxfmt && oxlint --fix`.
- TypeScript-only check: `bun --bun tsc --noEmit`; there is no package script for this.
- There is no root `build` script; the starter README mentions one, but `package.json` does not define it.

## Generated Files

- Do not hand-edit `src/routeTree.gen.ts`; it is generated and gitignored. Run `bun --bun run tanstack:generate-routes` after route file changes.
- Do not hand-edit `convex/_generated/**`; it is generated and gitignored. Run `bun --bun run convex:dev` or `bunx --bun convex codegen` before relying on generated `api`, `dataModel`, `Id`, or `Doc` types.
- If `convex/_generated/ai/guidelines.md` is missing, install/regenerate Convex AI files with `bunx --bun convex ai-files install` before substantial Convex work.

## Directory Guide

- `src/routes/`: TanStack Router file routes, including `__root.tsx`.
- `src/components/`: shared React components; `src/components/ui/` holds shadcn-style primitives.
- `src/integrations/convex/provider.tsx`: reads `VITE_CONVEX_URL` and creates the Convex React client.
- `src/integrations/tanstack-query/`: QueryClient setup and devtools wiring used by the router.
- `src/styles.css`: Tailwind imports, shadcn CSS import, theme tokens, and app-level utility classes.
- `convex/`: Convex schema and functions; do not edit `convex/_generated/*`.
- `public/`: static assets and web manifest.

## Tooling Facts

- `tsconfig.json` uses `strict: true`, `moduleResolution: "bundler"`, and aliases `@/*` and `#/*` to `src/*`.
- `.oxfmtrc.json` enforces no semicolons, single quotes, trailing commas, and 80-column print width.
- `.oxlintrc.json` enables TypeScript, React, import, unicorn, and oxc plugins; there is no ESLint config.
- `components.json` uses shadcn aliases, Lucide icons, and `src/styles.css`; it references `tailwind.config.js`, but Tailwind v4 config is effectively CSS/plugin driven here.
- Required local env vars are documented in `.env.example`: `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`.

## React And TanStack Start

- Add pages as TanStack Router files under `src/routes/`; keep filenames Router-compatible such as `index.tsx`, `$id.tsx`, and `__root.tsx`.
- Configure document metadata with the route `head` option, not Next.js metadata exports.
- Use TanStack Router APIs such as `Link`, `useNavigate`, route params, and route search instead of Next.js APIs.
- Keep global chrome and cross-app providers in `src/routes/__root.tsx` or explicit integration/provider files; do not recreate headers/footers in each page.
- After adding, renaming, or deleting routes, regenerate `src/routeTree.gen.ts`.

## UI And Styling

- Prefer existing shadcn primitives in `src/components/ui/` before adding custom controls or a new UI library.
- Use Tailwind utilities and tokens from `src/styles.css`; avoid ad hoc color systems unless the design direction intentionally changes.
- Use `cn()` from `@/lib/utils` for conditional class merging.
- Preserve the current soft school-score public-site visual language: Manrope/Fraunces, rounded surfaces, lagoon/palm/sand tokens, subtle borders, and responsive card/grid layouts.
- User-facing interface copy should be Brazilian Portuguese (`pt-BR`) unless the surrounding page is still starter/demo copy being replaced.
- Keep identifiers, filenames, table names, and technical structure in English.

## Convex-Specific Rules

- Read `convex/_generated/ai/guidelines.md` before changing Convex code when it exists.
- Always define validators for Convex function arguments.
- Derive identity with `ctx.auth.getUserIdentity()`; do not accept user IDs for authorization decisions.
- Prefer indexed queries and bounded reads over unbounded `filter(...).collect()` for new production paths.
- This project has a previous Convex version; schema changes may require a migration/backfill instead of direct narrowing.

## Practical Agent Workflow

- Trust executable config (`package.json`, `tsconfig.json`, `vite.config.ts`, `components.json`) over the starter README when they conflict.
- Before frontend changes, inspect `src/routes/__root.tsx`, `src/styles.css`, and nearby components to preserve app wiring and visual language.
- Before Convex changes, inspect `convex/schema.ts` and nearby functions, then regenerate Convex code if generated types are missing.
- Run `bun --bun tsc --noEmit` after TS/TSX changes, `bun --bun run check` after style/lint-sensitive changes, and `bun --bun run vite:build` before larger frontend handoff.
