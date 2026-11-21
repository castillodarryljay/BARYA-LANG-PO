import fs from 'node:fs';
import path from 'node:path';
import manifest from '../src/assets/manifest.json';
import { ALL_BASE_STORY_NODES, ALL_ENDINGS } from '../src/data/story';

/**
 * Story Graph & Asset Validator (`npm run validate-story`)
 * Verifies:
 * 1. No duplicate node IDs
 * 2. Every choice `next` points to an existing node, "PLANNER", or a valid "END:<ending_id>" / "END:AUTO"
 * 3. Every background ID exists in src/assets/manifest.json
 * 4. Every character sprite base exists in src/assets/manifest.json (or is player_*)
 * 5. Every node has at least 1 dialogue line and at least 1 choice
 */

const errors: string[] = [];
const warnings: string[] = [];

const nodeIds = new Set<string>();
const bgIds = new Set(manifest.backgrounds.map((b) => b.id));
const spriteBases = new Set(manifest.sprites.map((s) => s.id));
const endingIds = new Set(ALL_ENDINGS.map((e) => e.id));

for (const node of ALL_BASE_STORY_NODES) {
  if (nodeIds.has(node.id)) {
    errors.push(`Duplicate node ID: "${node.id}"`);
  }
  nodeIds.add(node.id);
}

for (const node of ALL_BASE_STORY_NODES) {
  if (!bgIds.has(node.scene.background)) {
    errors.push(`Node "${node.id}" references unknown background "${node.scene.background}"`);
  }

  for (const ch of node.scene.characters) {
    const base = ch.sprite.split('_')[0];
    const valid =
      base === 'player' ||
      spriteBases.has(base) ||
      spriteBases.has(ch.sprite);
    if (!valid) {
      errors.push(`Node "${node.id}" references unknown character sprite "${ch.sprite}"`);
    }
  }

  if (!node.scene.lines || node.scene.lines.length === 0) {
    errors.push(`Node "${node.id}" has zero dialogue lines`);
  }

  if (!node.choices || node.choices.length === 0) {
    errors.push(`Node "${node.id}" has zero choices (dead end)`);
  }

  for (const choice of node.choices) {
    if (!choice.next && !choice.triggerMinigame) {
      warnings.push(`Node "${node.id}" choice "${choice.text.slice(0, 30)}" has no next target (defaults to PLANNER)`);
      continue;
    }
    if (!choice.next || choice.next === 'PLANNER') continue;
    if (choice.next.startsWith('END:')) {
      const endId = choice.next.slice(4);
      if (endId !== 'AUTO' && !endingIds.has(endId)) {
        errors.push(`Node "${node.id}" links to unknown ending "${endId}"`);
      }
      continue;
    }
    if (!nodeIds.has(choice.next)) {
      errors.push(`Node "${node.id}" links to missing target node "${choice.next}"`);
    }
  }
}

for (const ending of ALL_ENDINGS) {
  if (!bgIds.has(ending.background)) {
    errors.push(`Ending "${ending.id}" references unknown background "${ending.background}"`);
  }
}

console.log(`Validated ${ALL_BASE_STORY_NODES.length} story nodes and ${ALL_ENDINGS.length} endings.`);
console.log(`Manifest assets: ${bgIds.size} backgrounds, ${spriteBases.size} character sprite families.`);

if (warnings.length > 0) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (errors.length > 0) {
  console.error(`Story validation FAILED with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}

console.log('Story validation PASSED with 0 errors!');
void fs;
void path;
