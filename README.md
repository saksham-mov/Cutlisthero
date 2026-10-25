# CutList Hero

A minimal, free, browser-based cut list optimizer for plywood, MDF, lumber, and sheet goods. Designed for woodworkers and makers who want an instant layout without signups, paywalls, or daily limits.

## Features

- **Multiple Projects**: Create and switch between local projects with auto-save.
- **Fast Packing Algorithm**: Greedy shelf packing with kerf width accounting.
- **SVG Cutting Diagrams**: Clear diagrams with piece dimensions and cut lines.
- **1-Click Share & Print**: Share project layouts via URL hash or print clean PDFs.
- **Private & Offline**: Runs 100% in your browser using `localStorage`. No accounts or tracking.

## Getting Started

Run locally with Node.js:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Deployment

Build the static production bundle:

```bash
npm run build
```

Deploy to Vercel or Cloudflare Pages with zero configuration:
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
