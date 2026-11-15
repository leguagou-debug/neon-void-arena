// Neon Void Arena - the hand-in program for make.fun's best-game-01.
// The game itself lives in game/ as plain static files (index.html plus
// ES modules, no build step, no network). This program copies game/ and
// screenshots/ to the output directory and writes dossier.json there
// with the kit's vendored buildDossier, byte for byte as the scorer
// rebuilds it. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the competition gate's own limits: at most four
// screenshots of 256 KiB each, at most 993 entries and 48 MiB in game/,
// paths under 1000 bytes, and dossier text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Neon Void Arena handed in to ${outputDir} (${dossier.length} dossier bytes)`);
