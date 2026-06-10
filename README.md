# Kundli Maker

A frontend-only Vedic Kundli (birth chart) maker. Generates a sidereal (Lahiri ayanamsa) birth chart with divisional charts, dashas, ashtakavarga, yogas & doshas, Panchang, and Varshphal — all computed in the browser.

## Features

- Sidereal calculations using the Lahiri ayanamsa
- North / South / East Indian chart styles
- Divisional (varga) charts
- Vimshottari dasha table
- Ashtakavarga
- Yogas & Doshas
- Panchang details
- Varshphal (annual chart)
- Interpretations
- Saves recent birth inputs to local storage for quick reload

## Project structure

All application code lives in the [`app/`](app) folder.

```
app/
  index.html
  package.json
  vite.config.ts
  tsconfig*.json
  scripts/
  src/
    astro/        # astrology/astronomy calculations
    components/   # React UI components
    data/         # static data (timezones, interpretations)
```

## Getting started

```powershell
cd app
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Scripts

Run these from inside the `app/` folder:

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build

## Tech stack

- React 18
- TypeScript
- Vite
- [astronomy-engine](https://github.com/cosinekitty/astronomy)

## Disclaimer

Calculations use the astronomy-engine library. For entertainment and educational purposes.
