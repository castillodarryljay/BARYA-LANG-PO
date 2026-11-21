import React, { useEffect, useRef, useState } from 'react';

interface AssetOverrideMap {
  backgrounds?: Record<string, string>;
  sprites?: Record<string, string>;
}

let cachedOverridePromise: Promise<AssetOverrideMap> | null = null;
export function loadAssetOverrides(): Promise<AssetOverrideMap> {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') {
    return Promise.resolve({});
  }
  if (!cachedOverridePromise) {
    cachedOverridePromise = fetch('/assets/index.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return cachedOverridePromise;
}

interface PixelBackgroundProps {
  backgroundId: string;
  className?: string;
  animated?: boolean;
}

const W = 320;
const H = 180;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function drawSkyBands(ctx: CanvasRenderingContext2D, colors: string[], height = 110) {
  const bandH = Math.ceil(height / colors.length);
  colors.forEach((c, i) => px(ctx, 0, i * bandH, W, bandH + 1, c));
}

function drawClouds(ctx: CanvasRenderingContext2D, t: number, color = '#fff7ed', shade = '#fed7aa') {
  const drift = Math.floor(t * 4) % (W + 80);
  const positions = [30, 140, 240];
  positions.forEach((base, idx) => {
    const x = ((base + drift * (idx % 2 === 0 ? 1 : 0.6)) % (W + 70)) - 45;
    const y = 18 + (idx % 3) * 14;
    px(ctx, x, y + 6, 42, 6, shade);
    px(ctx, x + 4, y + 2, 34, 8, color);
    px(ctx, x + 10, y - 2, 18, 6, color);
  });
}

function drawPhilippineFlag(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  px(ctx, x, y, 2, 62, '#e2e8f0');
  px(ctx, x - 1, y - 2, 4, 3, '#facc15');
  const wave = Math.round(Math.sin(t * 4) * 1.4);
  for (let i = 0; i < 24; i += 4) {
    const wy = y + 3 + (i > 10 ? wave : 0);
    px(ctx, x + 2 + i, wy, 4, 7, '#1d4ed8');
    px(ctx, x + 2 + i, wy + 7, 4, 7, '#dc2626');
  }
  // White triangle + yellow sun
  px(ctx, x + 2, y + 3, 7, 14, '#f8fafc');
  px(ctx, x + 9, y + 5, 3, 10, '#f8fafc');
  px(ctx, x + 12, y + 8, 2, 4, '#f8fafc');
  px(ctx, x + 4, y + 8, 3, 4, '#facc15');
}

function drawJeepney(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y + 8, 56, 18, '#dc2626');
  px(ctx, x + 4, y + 4, 48, 8, '#facc15');
  px(ctx, x + 6, y + 12, 44, 4, '#2563eb');
  px(ctx, x + 44, y + 10, 14, 14, '#e2e8f0'); // hood
  px(ctx, x + 55, y + 14, 4, 4, '#fef08a'); // headlight
  // Windows
  px(ctx, x + 8, y + 6, 10, 5, '#0f172a');
  px(ctx, x + 21, y + 6, 10, 5, '#0f172a');
  px(ctx, x + 34, y + 6, 10, 5, '#0f172a');
  // Wheels
  px(ctx, x + 9, y + 23, 9, 9, '#0f172a');
  px(ctx, x + 11, y + 25, 5, 5, '#94a3b8');
  px(ctx, x + 40, y + 23, 9, 9, '#0f172a');
  px(ctx, x + 42, y + 25, 5, 5, '#94a3b8');
}

function drawScene(ctx: CanvasRenderingContext2D, bgId: string, t: number) {
  ctx.clearRect(0, 0, W, H);

  switch (bgId) {
    case 'bg_provincial_house': {
      drawSkyBands(ctx, ['#fb923c', '#fdba74', '#fef3c7'], 75);
      // Distant rice fields & hills
      px(ctx, 0, 58, W, 24, '#15803d');
      px(ctx, 0, 68, W, 16, '#22c55e');
      // Wooden wall + capiz window
      px(ctx, 0, 0, 64, H, '#5c2d16');
      px(ctx, 256, 0, 64, H, '#5c2d16');
      px(ctx, 0, 0, W, 20, '#451a03');
      px(ctx, 0, 92, W, 88, '#78350f');
      // Capiz shell window frame
      px(ctx, 64, 20, 192, 74, '#451a03');
      for (let gx = 68; gx < 252; gx += 16) {
        for (let gy = 24; gy < 90; gy += 16) {
          px(ctx, gx, gy, 13, 13, 'rgba(254, 243, 199, 0.28)');
        }
      }
      // Coconut silhouette
      px(ctx, 188, 32, 5, 42, '#451a03');
      px(ctx, 174, 28, 32, 6, '#14532d');
      px(ctx, 178, 22, 24, 6, '#166534');
      // Dining table with pandesal & coffee
      px(ctx, 40, 126, 240, 54, '#92400e');
      px(ctx, 44, 128, 232, 8, '#b45309');
      // Pandesal paper bag & coffee mug
      px(ctx, 110, 110, 26, 22, '#d97706');
      px(ctx, 114, 108, 18, 5, '#fef3c7');
      px(ctx, 154, 118, 12, 12, '#f8fafc');
      px(ctx, 156, 120, 8, 3, '#451a03');
      const steamY = Math.round(Math.sin(t * 3) * 2);
      px(ctx, 158, 110 + steamY, 2, 5, 'rgba(255,255,255,0.6)');
      px(ctx, 162, 107 - steamY, 2, 5, 'rgba(255,255,255,0.5)');
      break;
    }

    case 'bg_school_gate': {
      drawSkyBands(ctx, ['#1d4ed8', '#38bdf8', '#fde68a', '#fed7aa'], 112);
      drawClouds(ctx, t);
      // Warm morning sun
      px(ctx, 250, 24, 24, 24, '#fef08a');
      px(ctx, 254, 28, 16, 16, '#ffffff');
      // School building silhouette
      px(ctx, 30, 68, 260, 54, '#fef3c7');
      px(ctx, 24, 60, 272, 10, '#991b1b');
      for (let wx = 44; wx < 276; wx += 22) {
        px(ctx, wx, 78, 12, 14, '#1e3a8a');
        px(ctx, wx, 98, 12, 14, '#1e3a8a');
      }
      // Concrete arch gate
      px(ctx, 88, 54, 18, 72, '#cbd5e1');
      px(ctx, 214, 54, 18, 72, '#cbd5e1');
      px(ctx, 84, 48, 152, 14, '#1e3a8a');
      px(ctx, 96, 52, 128, 6, '#facc15');
      // Acacia trees
      px(ctx, 8, 74, 38, 28, '#166534');
      px(ctx, 14, 66, 26, 14, '#22c55e');
      px(ctx, 274, 74, 40, 28, '#166534');
      px(ctx, 280, 66, 28, 14, '#22c55e');
      // Flagpole
      drawPhilippineFlag(ctx, 158, 20, t);
      // Sidewalk & road
      px(ctx, 0, 122, W, 16, '#94a3b8');
      px(ctx, 0, 138, W, 42, '#334155');
      for (let rx = 10; rx < W; rx += 32) px(ctx, rx, 157, 16, 3, '#facc15');
      // Passing pixel jeepney
      const jx = ((Math.floor(t * 28) % (W + 120)) - 60);
      drawJeepney(ctx, jx, 124);
      break;
    }

    case 'bg_jeepney_interior': {
      // Road streaming outside rear window
      drawSkyBands(ctx, ['#f97316', '#fbbf24', '#fef3c7'], 86);
      px(ctx, 0, 86, W, 44, '#475569');
      // Jeepney frame
      px(ctx, 0, 0, W, 24, '#7f1d1d');
      px(ctx, 0, 0, 38, H, '#991b1b');
      px(ctx, 282, 0, 38, H, '#991b1b');
      px(ctx, 38, 24, 244, 6, '#e2e8f0'); // steel grab bar
      // Hanging Barya Lang sign
      const swing = Math.round(Math.sin(t * 3.5) * 2);
      px(ctx, 118 + swing, 30, 84, 18, '#fef08a');
      px(ctx, 120 + swing, 32, 80, 14, '#dc2626');
      px(ctx, 126 + swing, 36, 68, 6, '#fef9c3');
      // Parallel benches
      px(ctx, 0, 116, 112, 64, '#b91c1c');
      px(ctx, 0, 116, 112, 8, '#facc15');
      px(ctx, 208, 116, 112, 64, '#b91c1c');
      px(ctx, 208, 116, 112, 8, '#facc15');
      // Metal floor
      px(ctx, 112, 126, 96, 54, '#334155');
      break;
    }

    case 'bg_classroom': {
      px(ctx, 0, 0, W, H, '#fef3c7');
      px(ctx, 0, 128, W, 52, '#a16207');
      // Green chalkboard
      px(ctx, 48, 24, 224, 76, '#78350f');
      px(ctx, 54, 30, 212, 64, '#14532d');
      // Chalk formulas
      px(ctx, 68, 42, 64, 3, 'rgba(255,255,255,0.75)');
      px(ctx, 68, 52, 92, 3, 'rgba(255,255,255,0.65)');
      px(ctx, 180, 44, 44, 3, 'rgba(254,240,138,0.8)');
      px(ctx, 180, 56, 58, 3, 'rgba(255,255,255,0.65)');
      // Portrait frame above board
      px(ctx, 150, 4, 20, 18, '#78350f');
      px(ctx, 153, 7, 14, 12, '#fef9c3');
      // Jalousie window on left
      px(ctx, 6, 26, 32, 82, '#38bdf8');
      for (let jy = 30; jy < 104; jy += 8) px(ctx, 6, jy, 32, 2, '#94a3b8');
      // Wooden armchairs
      for (let dx = 28; dx < 280; dx += 66) {
        px(ctx, dx, 134, 44, 28, '#92400e');
        px(ctx, dx + 6, 124, 32, 10, '#b45309');
      }
      break;
    }

    case 'bg_canteen': {
      px(ctx, 0, 0, W, 118, '#fff7ed');
      px(ctx, 0, 118, W, 62, '#d6d3d1');
      // Menu board
      px(ctx, 76, 12, 168, 36, '#7c2d12');
      px(ctx, 82, 18, 156, 24, '#14532d');
      px(ctx, 90, 24, 52, 4, '#facc15');
      px(ctx, 160, 24, 60, 4, '#fef9c3');
      px(ctx, 90, 32, 110, 4, '#fef9c3');
      // Food counter & glass display
      px(ctx, 20, 74, 280, 52, '#ea580c');
      px(ctx, 26, 56, 268, 22, 'rgba(186,230,253,0.45)');
      // Trays of turon, pansit, rice
      px(ctx, 42, 66, 44, 10, '#f59e0b');
      px(ctx, 102, 66, 44, 10, '#dc2626');
      px(ctx, 162, 66, 44, 10, '#facc15');
      px(ctx, 222, 66, 44, 10, '#22c55e');
      // Long canteen tables
      px(ctx, 24, 144, 272, 24, '#78350f');
      break;
    }

    case 'bg_computer_lab': {
      px(ctx, 0, 0, W, 120, '#1e293b');
      px(ctx, 0, 120, W, 60, '#0f172a');
      // Whiteboard
      px(ctx, 96, 12, 128, 42, '#f8fafc');
      px(ctx, 106, 22, 42, 12, '#38bdf8');
      px(ctx, 162, 22, 48, 12, '#22c55e');
      // Rows of glowing monitors
      for (let mx = 22; mx < 280; mx += 60) {
        px(ctx, mx, 68, 44, 30, '#334155');
        px(ctx, mx + 3, 71, 38, 24, '#0284c7');
        // Code lines blinking
        px(ctx, mx + 6, 75, 20, 2, '#4ade80');
        px(ctx, mx + 6, 80, 28, 2, '#fef08a');
        if (Math.floor(t * 2 + mx) % 2 === 0) {
          px(ctx, mx + 6, 85, 14, 2, '#f8fafc');
        }
        px(ctx, mx + 18, 98, 8, 8, '#475569');
        px(ctx, mx - 4, 106, 52, 16, '#475569');
      }
      break;
    }

    case 'bg_library': {
      px(ctx, 0, 0, W, 124, '#451a03');
      px(ctx, 0, 124, W, 56, '#78350f');
      // Tall bookshelves
      const bookCols = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#f59e0b'];
      for (let bx = 12; bx < 300; bx += 76) {
        px(ctx, bx, 14, 64, 102, '#7c2d12');
        for (let sy = 22; sy < 104; sy += 22) {
          px(ctx, bx + 4, sy + 14, 56, 4, '#451a03');
          for (let k = 0; k < 10; k++) {
            px(ctx, bx + 5 + k * 5, sy + (k % 2) * 2, 4, 14 - (k % 2) * 2, bookCols[(bx + k + sy) % bookCols.length]);
          }
        }
      }
      // Study desk + warm lamp
      px(ctx, 32, 132, 256, 48, '#92400e');
      px(ctx, 146, 104, 28, 10, '#15803d');
      px(ctx, 158, 114, 4, 20, '#f59e0b');
      px(ctx, 130, 114, 60, 26, 'rgba(253, 224, 71, 0.22)');
      break;
    }

    case 'bg_sari_sari': {
      drawSkyBands(ctx, ['#1e1b4b', '#312e81', '#7c2d12'], 80);
      px(ctx, 0, 80, W, 100, '#451a03');
      // Store wall & awning
      px(ctx, 44, 34, 232, 118, '#fef3c7');
      for (let ax = 40; ax < 276; ax += 20) {
        px(ctx, ax, 28, 12, 16, '#dc2626');
        px(ctx, ax + 12, 28, 8, 16, '#facc15');
      }
      // Grille window + hanging sachets
      px(ctx, 68, 52, 184, 66, '#1e293b');
      const sachets = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f97316'];
      for (let sx = 76; sx < 244; sx += 16) {
        px(ctx, sx, 56, 10, 14, sachets[(sx / 16) % sachets.length]);
        px(ctx, sx, 74, 10, 14, sachets[((sx / 16) + 2) % sachets.length]);
      }
      // Warm hanging bulb
      px(ctx, 158, 44, 6, 8, '#fef08a');
      px(ctx, 136, 48, 50, 32, 'rgba(254, 240, 138, 0.2)');
      // Wooden counter
      px(ctx, 56, 116, 208, 14, '#b45309');
      break;
    }

    case 'bg_carinderia': {
      px(ctx, 0, 0, W, 116, '#7c2d12');
      px(ctx, 0, 116, W, 64, '#451a03');
      // Tiled counter
      px(ctx, 24, 62, 272, 62, '#fef3c7');
      px(ctx, 24, 52, 272, 16, 'rgba(186,230,253,0.4)');
      // Stainless kaldero pots
      for (let kx = 42; kx < 260; kx += 48) {
        px(ctx, kx, 58, 34, 16, '#cbd5e1');
        px(ctx, kx + 4, 60, 26, 6, kx % 96 === 42 ? '#92400e' : '#dc2626');
        const sy = Math.round(Math.sin(t * 3 + kx) * 2);
        px(ctx, kx + 14, 46 + sy, 3, 7, 'rgba(255,255,255,0.5)');
      }
      // Checkered table foreground
      for (let tx = 0; tx < W; tx += 16) {
        px(ctx, tx, 138, 8, 42, '#dc2626');
        px(ctx, tx + 8, 138, 8, 42, '#fef9c3');
      }
      break;
    }

    case 'bg_boarding_house': {
      px(ctx, 0, 0, W, 126, '#1e293b');
      px(ctx, 0, 126, W, 54, '#334155');
      // Night city window
      px(ctx, 176, 22, 108, 66, '#0f172a');
      px(ctx, 190, 48, 22, 40, '#334155');
      px(ctx, 222, 38, 26, 50, '#475569');
      px(ctx, 254, 54, 24, 34, '#334155');
      // Lit windows
      px(ctx, 196, 56, 4, 4, '#facc15');
      px(ctx, 228, 46, 4, 4, '#facc15');
      px(ctx, 238, 60, 4, 4, '#facc15');
      // Double deck bed on left
      px(ctx, 16, 26, 8, 114, '#92400e');
      px(ctx, 116, 26, 8, 114, '#92400e');
      px(ctx, 24, 54, 92, 12, '#3b82f6');
      px(ctx, 24, 104, 92, 14, '#dc2626');
      // Study desk with warm lamp & noodles
      px(ctx, 152, 114, 148, 48, '#78350f');
      px(ctx, 260, 96, 18, 18, '#f59e0b');
      px(ctx, 232, 92, 56, 36, 'rgba(250, 204, 21, 0.18)');
      break;
    }

    case 'bg_manila_street': {
      drawSkyBands(ctx, ['#4c1d95', '#c2410c', '#f97316', '#fde047'], 102);
      // City skyline
      px(ctx, 10, 42, 46, 70, '#1e1b4b');
      px(ctx, 64, 28, 52, 84, '#312e81');
      px(ctx, 128, 48, 56, 64, '#1e293b');
      px(ctx, 198, 22, 58, 90, '#312e81');
      px(ctx, 264, 38, 48, 74, '#1e1b4b');
      // Elevated LRT track
      px(ctx, 0, 72, W, 12, '#475569');
      px(ctx, 52, 84, 14, 44, '#334155');
      px(ctx, 236, 84, 14, 44, '#334155');
      // Moving LRT train
      const tx = W - ((Math.floor(t * 42) % (W + 140)) - 20);
      px(ctx, tx, 58, 92, 14, '#e2e8f0');
      px(ctx, tx, 64, 92, 4, '#facc15');
      // Road & Jeepney
      px(ctx, 0, 126, W, 54, '#1e293b');
      const jx = (Math.floor(t * 32) % (W + 90)) - 60;
      drawJeepney(ctx, jx, 122);
      break;
    }

    case 'bg_rainy_flood': {
      drawSkyBands(ctx, ['#0f172a', '#1e3a5f', '#334155'], 110);
      // Silhouetted buildings & glowing streetlamp
      px(ctx, 16, 42, 74, 72, '#0f172a');
      px(ctx, 110, 32, 88, 82, '#1e293b');
      px(ctx, 220, 48, 84, 66, '#0f172a');
      px(ctx, 200, 34, 4, 82, '#64748b');
      px(ctx, 194, 34, 16, 6, '#fde047');
      px(ctx, 180, 40, 44, 52, 'rgba(253,224,71,0.16)');
      // Flooded water with golden reflection ripples
      px(ctx, 0, 114, W, 66, '#1e3a5f');
      for (let ry = 122; ry < 174; ry += 10) {
        const shift = Math.round(Math.sin(t * 4 + ry) * 6);
        px(ctx, 186 + shift, ry, 28, 3, 'rgba(253, 224, 71, 0.45)');
      }
      // Slanting rain streaks
      ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
      for (let i = 0; i < 42; i++) {
        const rx = ((i * 29 + Math.floor(t * 95)) % (W + 20)) - 10;
        const ry = ((i * 41 + Math.floor(t * 170)) % H);
        ctx.fillRect(rx, ry, 1, 9);
      }
      break;
    }

    case 'bg_fiesta_night': {
      drawSkyBands(ctx, ['#0f172a', '#1e1b4b', '#312e81'], 114);
      // Church silhouette
      px(ctx, 118, 44, 84, 74, '#475569');
      px(ctx, 142, 26, 36, 20, '#64748b');
      px(ctx, 158, 12, 4, 16, '#facc15');
      px(ctx, 152, 16, 16, 4, '#facc15');
      // Colorful overhead banderitas
      const flagCols = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#f97316'];
      for (let fx = 0; fx < W; fx += 14) {
        const sag = Math.round(Math.sin((fx / W) * Math.PI) * 18);
        px(ctx, fx, 18 + sag, 10, 10, flagCols[(fx / 14) % flagCols.length]);
        if (Math.floor(t * 3 + fx) % 3 === 0) {
          px(ctx, fx + 4, 14 + sag, 3, 3, '#fef08a');
        }
      }
      // Plaza ground & barbecue smoke
      px(ctx, 0, 118, W, 62, '#334155');
      px(ctx, 28, 106, 56, 32, '#b45309');
      px(ctx, 236, 106, 56, 32, '#b91c1c');
      break;
    }

    case 'bg_christmas_parol': {
      drawSkyBands(ctx, ['#020617', '#0f172a', '#1e1b4b'], 116);
      px(ctx, 0, 116, W, 64, '#1e293b');
      // Glowing Capiz Star Parols
      const parols = [60, 160, 260];
      parols.forEach((cx, idx) => {
        const glow = Math.floor(t * 3 + idx) % 2 === 0 ? '#facc15' : '#fb923c';
        px(ctx, cx - 18, 34, 36, 36, 'rgba(250, 204, 21, 0.16)');
        px(ctx, cx - 2, 26, 4, 48, glow);
        px(ctx, cx - 24, 48, 48, 4, glow);
        px(ctx, cx - 12, 38, 24, 24, '#dc2626');
        px(ctx, cx - 7, 43, 14, 14, '#fef08a');
      });
      // Bibingka stall
      px(ctx, 108, 106, 104, 44, '#7c2d12');
      px(ctx, 114, 114, 92, 12, '#f59e0b');
      break;
    }

    case 'bg_graduation_stage': {
      // Royal curtains & golden spotlight beams
      px(ctx, 0, 0, W, 122, '#1e3a8a');
      px(ctx, 0, 0, 48, 122, '#172554');
      px(ctx, 272, 0, 48, 122, '#172554');
      // Gold rays
      px(ctx, 124, 0, 72, 122, 'rgba(250, 204, 21, 0.16)');
      px(ctx, 142, 0, 36, 122, 'rgba(254, 249, 195, 0.22)');
      // Banner
      px(ctx, 74, 18, 172, 24, '#f59e0b');
      px(ctx, 78, 22, 164, 16, '#1e3a8a');
      px(ctx, 94, 28, 132, 4, '#fef08a');
      // Wooden stage & podium
      px(ctx, 0, 122, W, 58, '#78350f');
      px(ctx, 0, 122, W, 6, '#f59e0b');
      px(ctx, 144, 88, 32, 42, '#92400e');
      px(ctx, 140, 84, 40, 6, '#facc15');
      // Floating golden confetti
      for (let i = 0; i < 20; i++) {
        const cx = (i * 37 + Math.floor(t * 14)) % W;
        const cy = (i * 23 + Math.floor(t * 22)) % 120;
        px(ctx, cx, cy, 3, 3, i % 2 === 0 ? '#facc15' : '#fef9c3');
      }
      break;
    }

    default: {
      // bg_barangay_street fallback
      drawSkyBands(ctx, ['#0284c7', '#38bdf8', '#fde68a'], 106);
      drawClouds(ctx, t);
      // Barangay houses & basketball hoop
      px(ctx, 14, 62, 68, 58, '#fed7aa');
      px(ctx, 10, 52, 76, 12, '#b91c1c');
      px(ctx, 96, 70, 72, 50, '#bbf7d0');
      px(ctx, 92, 62, 80, 10, '#1e3a8a');
      px(ctx, 218, 56, 86, 64, '#fef08a');
      px(ctx, 214, 48, 94, 10, '#c2410c');
      // Hoop
      px(ctx, 184, 56, 3, 64, '#475569');
      px(ctx, 174, 54, 22, 14, '#f8fafc');
      px(ctx, 180, 66, 10, 3, '#ea580c');
      // Street
      px(ctx, 0, 120, W, 60, '#475569');
      for (let rx = 14; rx < W; rx += 34) px(ctx, rx, 148, 18, 3, '#f8fafc');
      break;
    }
  }
}

export const PixelBackground: React.FC<PixelBackgroundProps> = ({
  backgroundId,
  className = '',
  animated = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadAssetOverrides().then((map) => {
      if (active) {
        setOverrideUrl(map.backgrounds?.[backgroundId] ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [backgroundId]);

  useEffect(() => {
    if (overrideUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let start = performance.now();

    const render = (now: number) => {
      const elapsed = animated ? (now - start) / 1000 : 0;
      drawScene(ctx, backgroundId, elapsed);
      if (animated) {
        frameId = window.requestAnimationFrame(render);
      }
    };
    render(start);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [backgroundId, animated, overrideUrl]);

  if (overrideUrl) {
    return (
      <img
        src={overrideUrl}
        alt={backgroundId}
        className={`w-full h-full object-cover pixelated ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label={backgroundId}
      className={`w-full h-full object-cover pixelated block ${className}`}
    />
  );
};
