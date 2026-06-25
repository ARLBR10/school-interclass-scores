<!-- BEGIN:tanstack-start-agent-rules -->

# This Is TanStack Start

This repo uses TanStack Start with React 19, Vite, Nitro, and Tailwind CSS 4.
Do not add Next.js APIs, `next/link`, `next/navigation`, `next/font`, App
Router metadata exports, or `page.tsx`/`layout.tsx` route files.

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

# AGENTS.md `school-interclass-scores`

## Project Snapshot

- Package manager: Bun.
- Frontend: TanStack Start, React 19, Tailwind CSS 4, and shadcn components.
- Backend: Convex.
- Product goal: public viewer for interclass scores, matches, teams, players,
  and related school data.

## Commands

- Install: `bun install`.
- Full dev stack: `bun --bun run dev`.
- Frontend only: `bun --bun run vite:dev`.
- Convex only: `bun --bun run convex:dev`.
- Production build: `bun --bun run vite:build`.
- Preview built frontend: `bun --bun run vite:preview`.
- Tests: `bun --bun run test`.
- Lint/format check: `bun --bun run check`.
- Auto-format/fix: `bun --bun run format`.
- TypeScript-only check: `bun --bun tsc --noEmit`.

## Working Principles

- Prefer small, direct changes when they solve the problem cleanly.
- If the existing structure is causing the issue, suggest a broader rewrite
  instead of forcing a fragile workaround.
- Keep the UX practical and simple. Avoid unnecessary abstractions, flows, or
  visual complexity.
- Support both mobile and desktop layouts for user-facing UI.
- UI text should be Brazilian Portuguese (`pt-BR`). Chat, commit messages,
  identifiers, filenames, table names, and technical structure can stay in
  English.
- Prefer existing project patterns and shadcn primitives before adding new UI
  dependencies.
- Use Tailwind utilities and existing tokens from `src/styles.css`.
- When reading Convex data from React, run it through TanStack Query when
  possible to improve app performance and keep data access consistent.
- Trust executable configuration files over README or starter text when they
  conflict.

## Code Clarity

- Add TSDoc and comments when they help agents and humans understand behavior
  under the hood.
- For exported functions, shared utilities, complex components, and non-obvious
  logic, document the description, parameters, and return value when applicable.
- Keep comments useful and concise. Do not restate obvious code.

## Suggestions

- The agent may suggest improvements for performance, organization, compute
  usage, UX, maintainability, or correctness.
- Broader rewrites are valid suggestions when they would be cleaner or safer
  than adding temporary fixes or "silver tape" patches.
- Suggestions that change scope or direction should be approved by the human
  before implementation.
- If a suggestion is minor and directly supports the requested task, implement
  it only when it is clearly low-risk and consistent with the existing plan.

## Convex Notes

- Follow `convex/_generated/ai/guidelines.md` for Convex-specific rules.
- Define validators for Convex function arguments.
- Derive identity with `ctx.auth.getUserIdentity()` for authorization decisions.
- Prefer indexed queries and bounded reads for production paths.

## Verification

- Run `bun --bun tsc --noEmit` after TypeScript or TSX changes when practical.
- Run `bun --bun run check` after formatting or lint-sensitive changes.
- Run `bun --bun run vite:build` before larger frontend handoff when practical.
