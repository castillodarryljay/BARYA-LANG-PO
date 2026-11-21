import fs from 'node:fs';
import path from 'node:path';

/**
 * Offline Integrity Audit (`npm run check-offline`)
 * Scans build output (`dist/` and optional `dist-single/`) for any external
 * `http://` or `https://` URLs and fails if any runtime network dependency is found.
 * Standard XML/SVG namespace strings (w3.org, etc.) are explicitly allowed.
 */

const ALLOWED_URL_PATTERNS = [
  /^https?:\/\/www\.w3\.org\//i,
  /^https?:\/\/schemas\./i,
  /^https?:\/\/ns\.adobe\.com\//i,
  /^https?:\/\/reactjs\.org\//i,
  /^https?:\/\/react\.dev\//i,
  /^https?:\/\/fb\.me\//i,
  /^https?:\/\/bit\.ly\/wb-/i,
  /^https?:\/\/tailwindcss\.com\/?$/i,
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.0\.0\.1/i,
];

const TEXT_EXTS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.webmanifest']);
const URL_REGEX = /https?:\/\/[^\s"'`<>\\)\]]+/gi;

function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (TEXT_EXTS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const dirsToScan = ['dist', 'dist-single'].filter((d) => fs.existsSync(d));
if (dirsToScan.length === 0) {
  console.error('No build directory found (dist/ or dist-single/). Run `npm run build` first.');
  process.exit(1);
}

const violations: { file: string; url: string }[] = [];

for (const dir of dirsToScan) {
  const files = walk(dir);
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    // Strip license block comments (/* ... */) before scanning for runtime URLs
    const content = raw.replace(/\/\*[\s\S]*?\*\//g, '');
    const matches = content.match(URL_REGEX) ?? [];
    for (const url of matches) {
      const cleaned = url.replace(/[.,;:'")\]}]+$/, '');
      const allowed = ALLOWED_URL_PATTERNS.some((rx) => rx.test(cleaned));
      if (!allowed) {
        violations.push({ file, url: cleaned });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Offline audit FAILED! Found ${violations.length} external URL(s):`);
  for (const v of violations.slice(0, 30)) {
    console.error(`  x ${v.file}: ${v.url}`);
  }
  process.exit(1);
}

console.log(`Offline audit PASSED! Zero external runtime URLs found across: ${dirsToScan.join(', ')}.`);
