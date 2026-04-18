# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Tic Tac Toe Squared (`artifacts/ttt-squared`)

- **Kind**: react-vite web app
- **Preview path**: `/`
- **Description**: A web game of "Ultimate Tic-Tac-Toe" (Tic Tac Toe Squared) where the human plays as X and an LLM plays as O.
- **Features**:
  - 3×3 grid of 9 smaller 3×3 tic-tac-toe boards
  - Move routing: placing in cell (row, col) forces opponent to play in big-grid board (row, col)
  - If target board is finished (won/tied), opponent can play anywhere
  - LLM API calls via OpenAI-compatible endpoints, fully client-side
  - Settings panel (base URL, API key, model fetch/manual) persisted to localStorage
  - Animated X/O marks, active board highlighting, win/tie overlays
- **Key files**:
  - `src/lib/gameLogic.ts` — pure game rules
  - `src/lib/llmService.ts` — LLM API calls & prompt
  - `src/lib/settings.ts` — localStorage persistence
  - `src/pages/Game.tsx` — main game page
  - `src/components/BigBoard.tsx` — 9-board grid
  - `src/components/SmallBoard.tsx` — individual board
  - `src/components/SettingsPanel.tsx` — LLM config panel
  - `src/components/StatusBar.tsx` — turn/result status

### API Server (`artifacts/api-server`)

- **Kind**: Express API
- **Preview path**: `/api`
- **Description**: Shared Express API server (health check only for now).
