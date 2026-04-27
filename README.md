# Dyscolor

Aide à la lecture pour les enfants dyslexiques. Colle un texte, il s'affiche avec des couleurs alternées par syllabe, mot ou ligne.

→ [www.dyscolor.com](https://www.dyscolor.com)

## Fonctionnalités

- **3 modes** : syllabe / mot / ligne
- **Lettres muettes** : affichage en gris clair (`e` final, `h`, `t`/`s`/`x`/`z` finaux, `-aient`)
- **3 palettes** de couleurs accessibles WCAG AA
- **Police Luciole** — conçue pour les personnes dyslexiques
- **Copier** vers Pages, Word, Google Docs (avec les couleurs)
- **Imprimer** avec conservation des couleurs
- Fonctionne hors-ligne (PWA)

## Stack

| Rôle | Outil |
|---|---|
| Framework | [Astro 6](https://astro.build) — site statique |
| Styles | [Tailwind CSS v4](https://tailwindcss.com) |
| Syllabation | [`@dyscolor/syllabify-fr-wasm`](https://github.com/kevinlabory/syllabify-fr) — Rust/WASM, port de [LireCouleur 6](https://lirecouleur.arkaline.fr) |
| Infra | [SST v4](https://sst.dev) → AWS S3 + CloudFront (eu-west-3) |
| Police | [Luciole](https://www.luciole-vision.com) (CC-BY 4.0) |

## Développement

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # build statique → dist/
npm run preview   # prévisualiser le build
npm test          # suite vitest
```

## Déploiement

Le déploiement est **automatique** via GitHub Actions à chaque push sur `main`.
SST invalide le cache CloudFront (~1-5 min de propagation).

## Structure

```
src/
  layouts/    BaseLayout.astro (HTML, SEO, JSON-LD)
  components/ Header.astro · DyscolorApp.astro
  lib/        engine.ts · colorize.ts · syllabify.ts · silent.ts · palettes.ts · types.ts
  styles/     global.css
  pages/      index.astro
packages/
  syllabify-fr/   implémentation TypeScript pure (MCP server, tests)
public/
  fonts/      Luciole-Regular.woff2 · Luciole-Bold.woff2
  sw-register.js · og-image.png · favicon.svg · manifest.webmanifest
scripts/
  generate-og.mjs
sst.config.ts
```

## Contribuer

Voir [CLAUDE.md](./CLAUDE.md) pour les conventions du projet (branches, commits, release).

## Licence

[GPL-3.0-or-later](LICENSE) — hérité de [syllabify-fr](https://github.com/kevinlabory/syllabify-fr) (port de LireCouleur 6).
