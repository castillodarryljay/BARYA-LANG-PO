# Barya Lang: Road to Graduation

A mobile-first, 100% offline **branching visual novel & Filipino student life-sim** built with React, TypeScript, Vite, Tailwind CSS, and Zustand. Survive from **Senior High School (Grade 11–12)** through **College (Year 1–4)** while managing tight allowance (*barya*), grades (Philippine 1.0–5.0 GWA scale), energy, mental health, relationships, scholarships, and part-time *raket* minigames — written in natural **Taglish** with a full **English** toggle.

---

## Features

- **Character Creation**: Custom name, gender (updates sprites & pronouns), hometown (Pangasinan, Iloilo, Davao del Sur, Batangas, Metro Manila), 5 family backgrounds, 6 SHS strands (STEM, ABM, HUMSS, GAS, TVL-ICT, TVL-HE), and 9 college courses (BSIT, BSCS, Nursing, Education, Engineering, Criminology, BSBA, Hospitality Management, Psychology).
- **Weekly Life-Sim Loop**: 3 time slots per week across Study, Attend Class, Work, Rest, Barkada, Org Activity, and Family Time, resolving allowance, living expenses, GWA updates, scholarship checks, and branching story events.
- **7 Playable Touch-Friendly Minigames**:
  1. **Carinderia Rush** — Tap-to-serve ulam orders before time runs out
  2. **Jeepney Fare Pass** — Calculate and hand back exact *sukli* using peso coins
  3. **Tutoring Quiz** — Match Filipino SHS/College study Q&A cards
  4. **Fastfood Crew** — Stack burger orders in exact sequence
  5. **Freelance Task** — Fix broken code / layout puzzles (ICT/Business bonus)
  6. **Sell Tusok-Tusok / School Supplies** — Buy stock & price smartly for campus weather
  7. **Scholarship Application Quest** — Multi-step documents, essay choices & interview
- **Data-Driven Story Engine**: 144+ playable story nodes across SHS Year 1–2, College Year 1–4, 30+ weighted random events, 5 side arcs (Barkada, Crush, Family, Org, Thesis), 9 per-course arcs, Crisis events, and 8 unlockable Endings + persistent Endings Gallery.
- **100% Offline Forever**: Zero runtime network calls, locally bundled `@fontsource/*` fonts, procedural Web Audio chiptune BGM & SFX, `localStorage` auto-save + 3 manual slots + JSON export/import, Workbox PWA precaching, and a self-contained single-file HTML build.
- **In-App Story Editor & Debug Mode**: Browse, edit, add, live-test, and export story JSON directly inside the app.

---

## Quick Start & Commands

```bash
# Install dependencies
npm install

# Run local dev server (http://localhost:3000)
npm run dev

# Run pure story engine unit tests (node:test)
npm run test

# Validate all story JSON files (IDs, next links, backgrounds, choices, endings)
npm run validate-story

# Production PWA build (outputs to dist/ with Workbox service worker)
npm run build

# Single-file 100% self-contained HTML build (outputs to dist-single/index.html)
npm run build:single

# Verify ZERO external runtime URLs exist in dist/ or dist-single/
npm run check-offline
```

---

## How to Expand the Game

### 1. Add Chapters, Random Events, Side Arcs, or Course Events
All story content lives in `/src/data/story/`:
- Main chapters: `shs_year1.json` .. `college_year4.json`
- Random & crisis events: `events_random.json`
- Side arcs: `arcs_side/*.json`
- Course arcs: `arcs_course/*.json`
- Endings: `endings.json`

Add any new `StoryNode` object matching the TypeScript schema in `/src/types/game.ts`, then run `npm run validate-story` to verify there are no broken `next` links, missing backgrounds, or duplicate IDs. You can also prototype and export nodes using the in-app **Story Editor**.

### 2. Add a New Minigame
1. Add its config entry to `MINIGAME_CONFIGS` in `/src/data/config.ts` and extend `MinigameId` in `/src/types/game.ts`.
2. Create the React component inside `/src/components/minigames/` accepting `{ language, onFinish }`.
3. Register it in `/src/components/minigames/MinigameHost.tsx`.

### 3. Drop In Custom HD Pixel-Art PNG Assets (Zero Code Changes)
By default, crisp 16-bit procedural pixel-art renderers power all 16 backgrounds and 11 character sprite families (with 6 emotions each) offline with zero 404s. To upgrade any scene or sprite with custom PNG artwork:
1. Check `/src/assets/manifest.json` for exact `id` names, recommended dimensions, and consistent art-style prompts.
2. Place your `.png` files under `/public/assets/backgrounds/<id>.png` or `/public/assets/sprites/<id>.png`.
3. Register their filenames in `/public/assets/index.json` (e.g., `"backgrounds": ["bg_school_gate"], "sprites": ["mama_worried"]`).
4. Rebuild with `npm run build` — `VitePWA` automatically precaches them for offline play.

---

## Deploying to Vercel via GitHub & Installing as an Android App (Chrome WebAPK / APK)

This repository includes `vercel.json`, a full Web App Manifest (`manifest.webmanifest` with maskable icons + mobile/desktop screenshots), and a Workbox Service Worker configured for Vercel HTTPS hosting.

### 1. Publish to Vercel using GitHub
1. Push this repository to GitHub (`git init && git add . && git commit -m "Initial release" && git push`).
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import your GitHub repository.
3. Keep the auto-detected settings from `vercel.json` (**Framework**: Vite, **Build Command**: `npm run build`, **Output Directory**: `dist`) and click **Deploy**.

### 2. Install as a Native Android App Directly from Chrome (WebAPK)
1. Open your live `https://<your-project>.vercel.app` link in **Google Chrome on Android**.
2. Tap the **Install App** button on the title screen (or Chrome menu **`⋮` → Install app**).
3. Chrome automatically generates and installs a real **Android WebAPK** into your Home Screen, App Drawer, and Android Apps list — playable **100% offline** in Airplane Mode!

### 3. Download a Shareable `.apk` File (PWABuilder or Capacitor)
- **Option A — Instant `.apk` from your Vercel URL (no Android Studio needed):**
  1. Open [pwabuilder.com](https://www.pwabuilder.com/) and paste your live `https://<your-project>.vercel.app` URL.
  2. Click **Package for Stores → Android → Generate Package** to download a ready-to-install `.apk` / `.aab` (Trusted Web Activity) directly from your Vercel PWA manifest.
- **Option B — 100% Standalone Offline APK via Capacitor:**
```bash
# 1. Build the offline web bundle
npm run build

# 2. Install Capacitor in your project
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Initialize Capacitor pointing at Vite's dist/ folder
npx cap init "Barya Lang" "com.baryalang.graduation" --web-dir dist

# 4. Add Android platform & sync web assets
npx cap add android
npx cap sync android

# 5. Open in Android Studio to sign and build a release APK / AAB
npx cap open android
```

In `android/app/src/main/AndroidManifest.xml`, no `INTERNET` permission is required because all fonts, sprites, audio, and story JSON are bundled locally inside `dist/`.
