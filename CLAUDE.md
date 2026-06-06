# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peter Markdown is an Electron-based WYSIWYG Markdown editor (inspired by Typora). The project is in early development (P1 phase: basic framework + rendering).

**Tech Stack:** Electron + electron-vite, React 18, TypeScript, ProseMirror (WYSIWYG), markdown-it (parser), shiki (code highlighting), KaTeX (math), Mermaid (diagrams), Zustand (state management).

## Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm test             # Run unit tests (vitest)
npm run test:watch   # Run unit tests in watch mode
npm run test:coverage # Run unit tests with coverage
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run package:mac  # electron-builder --mac
```

## Architecture

The app runs as an Electron desktop app with three layers:

**Main process** (`electron/`): Window management, native menus, file dialogs, file system IPC. Uses `contextIsolation: true` and `nodeIntegration: false`. Communicates with renderer via `electronAPI` on `window`.

**Renderer** (`src/`): React app with these modules:
- **File management**: File tree browsing, directory traversal, file watching (chokidar), extension filtering (`.md`, `.mdx`, `.markdown`, `.mdown`, `.mkd`)
- **Editor core**: ProseMirror WYSIWYG editor with Markdown schema, input rules, keyboard shortcuts, undo/redo
- **Outline/TOC**: Extracts headings (h1-h6), builds hierarchy tree, click-to-scroll navigation with highlighting
- **Render engine**: markdown-it parsing, shiki code highlighting, KaTeX math, Mermaid diagrams
- **State management**: Zustand stores (editor state, file tree, UI, config)
- **Layout components**: AppLayout, Sidebar (collapsible file tree), StatusBar, TitleBar

## Two Operating Modes

1. **Folder Browser**: Open a folder -> left file tree (Markdown files only) -> right read-only rendered view
2. **Single File Editor** (WYSIWYG): Double-click a file -> ProseMirror in-place editing with real-time rendering

## Development Status

The project is in early development. The `src/` and `electron/` directories are mostly stub files. Tests have complete mock implementations but need real module imports once source files are created. See `需求规格与架构设计-v2.md` for the full spec.

## Testing

- Unit tests in `tests/unit/` use Vitest + jsdom + Testing Library
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/` are skeleton (placeholder) tests
- Test fixtures in `tests/fixtures/`
- Tests stub Electron IPC via `tests/setup.ts`
- Many tests use `@ts-expect-error` for deliberate edge case testing