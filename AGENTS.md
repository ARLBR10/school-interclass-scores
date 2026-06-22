<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`bunx convex ai-files install`.

<!-- convex-ai-end -->

# Repository Notes

## Commands

- Use Bun; the lockfile is `bun.lock` and scripts are written for `bun --bun`.
- Install: `bun install`.
- Full dev server: `bun --bun run dev` starts Vite on port 3000 and `convex dev` concurrently.
- Frontend only: `bun --bun run vite:dev`; Convex only: `bun --bun run convex:dev`.
- Production build script is `bun --bun run vite:build`; there is no root `build` script even though the starter README mentions one.
- Tests: `bun --bun run test`; focused Vitest runs can pass a file or name after `--`, for example `bun --bun run test -- src/foo.test.ts`.
- Lint/format: `bun --bun run check` for `oxfmt --check && oxlint`; `bun --bun run format` runs `oxfmt && oxlint --fix`.
- No typecheck script exists; use `bun --bun tsc --noEmit` when a TypeScript-only check is needed.

## Generated Files

- Do not hand-edit `src/routeTree.gen.ts`; it is generated and gitignored. After route file changes run `bun --bun run tanstack:generate-routes`.
- Do not hand-edit `convex/_generated/**`; it is generated and gitignored. Run `bun --bun run convex:dev` or `bunx --bun convex codegen` before relying on `convex/_generated/api` or `dataModel` types.

## App Shape

- This is a TanStack Start app with file routes in `src/routes`; router creation is in `src/router.tsx` and imports `src/routeTree.gen.ts`.
- The root route `src/routes/__root.tsx` wraps all pages with `ConvexProvider`, `Header`, `Footer`, and TanStack devtools.
- Convex backend code lives in `convex/`; current schema tables are `matches`, `teams`, and `players`.
- The site is intended as a public viewer for scores, matches, teams, players, and related interclass data.

## UI And Styling

- shadcn config is `components.json`: `radix-rhea` style, Lucide icons, aliases `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.
- Tailwind v4 styling is centralized in `src/styles.css`, which imports `tailwindcss`, `tw-animate-css`, and `shadcn/tailwind.css`; do not assume a `tailwind.config.js` exists.
- Path aliases are `@/*` and `#/*` to `src/*`.

## Known Scaffold Traps

- `README.md` still contains generic TanStack starter guidance; trust `package.json` scripts and config files over README command names.
