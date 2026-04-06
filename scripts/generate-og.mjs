/**
 * Génère public/og-image.png (1200×630) depuis un SVG inline.
 * Usage : node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'og-image.png');

const C1 = '#0e7490'; // teal
const C2 = '#92400e'; // amber

const svg = /* xml */ `
<svg width="1200" height="630" viewBox="0 0 1200 630"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Fond crème -->
  <rect width="1200" height="630" fill="#faf7f2"/>

  <!-- Bande verticale gauche -->
  <rect x="0" y="0" width="8" height="630" fill="${C1}"/>

  <!-- Logo -->
  <text x="80" y="185"
        font-family="Arial, Helvetica, sans-serif"
        font-size="108" font-weight="bold" letter-spacing="-2">
    <tspan fill="${C1}">Dys</tspan><tspan fill="${C2}">co</tspan><tspan fill="${C1}">lor</tspan>
  </text>

  <!-- Accroche -->
  <text x="80" y="248"
        font-family="Arial, Helvetica, sans-serif"
        font-size="30" fill="#78716c">
    Aide à la lecture pour les enfants dyslexiques
  </text>

  <!-- Séparateur -->
  <line x1="80" y1="290" x2="1120" y2="290"
        stroke="#e7e5e4" stroke-width="1.5"/>

  <!-- Exemple de texte coloré par syllabe -->
  <text x="80" y="378"
        font-family="Arial, Helvetica, sans-serif"
        font-size="52" font-weight="bold">
    <tspan fill="${C1}">La </tspan><tspan fill="${C2}">lec</tspan><tspan fill="${C1}">ture </tspan><tspan fill="${C2}">en </tspan><tspan fill="${C1}">syl</tspan><tspan fill="${C2}">la</tspan><tspan fill="${C1}">bes</tspan>
  </text>
  <text x="80" y="448"
        font-family="Arial, Helvetica, sans-serif"
        font-size="52" font-weight="bold">
    <tspan fill="${C2}">ou </tspan><tspan fill="${C1}">par </tspan><tspan fill="${C2}">mots</tspan><tspan fill="#a8a29e">, </tspan><tspan fill="${C1}">ou </tspan><tspan fill="${C2}">par </tspan><tspan fill="${C1}">li</tspan><tspan fill="${C2}">gnes.</tspan>
  </text>

  <!-- Pilules fonctionnalités -->
  <rect x="80"  y="490" width="152" height="42" rx="21" fill="${C1}" opacity="0.12"/>
  <text x="156" y="518" font-family="Arial, Helvetica, sans-serif"
        font-size="19" fill="${C1}" font-weight="600" text-anchor="middle">Syllabe</text>

  <rect x="248" y="490" width="108" height="42" rx="21" fill="${C2}" opacity="0.12"/>
  <text x="302" y="518" font-family="Arial, Helvetica, sans-serif"
        font-size="19" fill="${C2}" font-weight="600" text-anchor="middle">Mot</text>

  <rect x="372" y="490" width="112" height="42" rx="21" fill="${C1}" opacity="0.12"/>
  <text x="428" y="518" font-family="Arial, Helvetica, sans-serif"
        font-size="19" fill="${C1}" font-weight="600" text-anchor="middle">Ligne</text>

  <rect x="500" y="490" width="230" height="42" rx="21" fill="#b8b0a0" opacity="0.18"/>
  <text x="615" y="518" font-family="Arial, Helvetica, sans-serif"
        font-size="19" fill="#78716c" font-weight="600" text-anchor="middle">Lettres muettes</text>

  <!-- URL -->
  <text x="1120" y="596"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22" fill="#a8a29e" text-anchor="end">dyscolor.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log('✓ OG image générée :', OUT);
