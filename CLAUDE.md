# Dyscolor — Instructions pour Claude Code

## Stack

- **Frontend** : Astro 6 (static), Vite 7, Tailwind CSS v4
- **Moteur** : Rust/WASM via `@dyscolor/syllabify-fr-wasm` (npm)
- **Infra** : AWS CloudFront + S3, déployé avec SST v4
- **Tests** : vitest (avec `vite-plugin-wasm` + `vite-plugin-top-level-await`)

## Commandes

```bash
npm run dev          # serveur de développement local
npm run build        # build Astro → dist/
npm run preview      # prévisualiser le build
npm test             # vitest run (suite complète)
npm run test:watch   # vitest en mode watch
npm run mcp          # démarrer le serveur MCP local (tsx)
```

## Architecture

```
src/lib/engine.ts          ← point d'entrée unique vers le WASM
  └─ importe de @dyscolor/syllabify-fr-wasm

astro.config.mjs           ← alias Vite : @dyscolor/syllabify-fr → engine.ts
                             (browser uniquement — le serveur MCP utilise tsx
                              et résout @dyscolor/syllabify-fr via le workspace)

packages/syllabify-fr/    ← implémentation TypeScript pure (MCP server, tests)
packages/                  ← plus de syllabify-fr-wasm ici (géré par npm)

sst.config.ts              ← CSP inclut 'wasm-unsafe-eval' (requis pour WebAssembly)
public/sw-register.js      ← enregistrement du service worker (fichier externe,
                             couvert par script-src 'self')
```

## Licence

**GPL-3.0-or-later** — hérité de `syllabify-fr` (port de LireCouleur 6, copyleft).
Toute contribution au projet est soumise à cette licence.

## Git — règles absolues

> **⚠️ Ne jamais commiter ni pusher directement sur `main`, quelle que soit
> la taille du changement — une ligne de doc incluse.**

Tout changement passe par :
1. Une branche courte créée depuis `main`
2. Un commit (ou plusieurs) sur cette branche
3. Une Pull Request → review → **merge squash** → delete branch

### Nommage des branches

| Préfixe | Usage |
|---------|-------|
| `feat/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `hotfix/` | Correctif urgent sur prod |
| `docs/` | Documentation uniquement |
| `chore/` | Maintenance, dépendances |

### Messages de commit

Conventional Commits : `type: description courte en français`

```
feat: ajoute le mode ligne
fix(csp): autorise wasm-unsafe-eval
docs: met à jour la licence dans le README
chore: met à jour @dyscolor/syllabify-fr-wasm vers 0.6.0
```

## Checklist avant chaque PR

```bash
npm test          # doit passer à 100 %
npm run build     # doit se terminer sans erreur
```

Vérifier également que `dist/index.html` ne contient aucun `<script>` inline
exécutable (hors `type="application/ld+json"`).

## Mettre à jour le moteur WASM

Le binaire WASM n'est plus commité dans ce repo. Pour passer à une nouvelle
version publiée sur npm :

```bash
npm install @dyscolor/syllabify-fr-wasm@x.y.z
# commiter uniquement package.json et package-lock.json
```

## Déploiement

Le déploiement en production est **automatique** via GitHub Actions
(`.github/workflows/deploy-prod.yml`) à chaque push sur `main`.
SST invalide le cache CloudFront à la fin du deploy (~1-5 min de propagation).

Ne jamais lancer `npm run deploy` manuellement sauf en cas d'urgence.
