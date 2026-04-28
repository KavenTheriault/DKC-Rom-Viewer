# Donkey Kong Country — Explorer

A web app for browsing **Donkey Kong Country** (SNES) ROM data in the browser: levels, sprites, palettes, entities, animations, and related structures. The UI is built with **React**, **TypeScript**, and **Vite**; parsing and decoding live under `src/rom-io`.

You need a compatible ROM dump (for example the US v1.0 release the UI references) loaded from your device or use the built-in button to download it.

**Live site:** [https://kaventheriault.github.io/](https://kaventheriault.github.io/)

## Prerequisites

- [Node.js](https://nodejs.org/) (a current LTS version is recommended)
- npm (comes with Node)

## Setup

```bash
npm install
```

## Development

Start the Vite dev server with hot reload:

```bash
npm run dev
```

Open the URL Vite prints (by default [http://localhost:5173](http://localhost:5173)).

## Production build

Type-check and build static assets to `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---
