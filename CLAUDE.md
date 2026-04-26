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
| `release/` | Bump de version |

### Messages de commit

Conventional Commits : `type: description courte en français`

```
feat: ajoute le mode ligne
fix(csp): autorise wasm-unsafe-eval
docs: met à jour la licence dans le README
chore: met à jour @dyscolor/syllabify-fr-wasm vers 0.6.0
release: v0.2.0
```

## Checklist avant chaque PR

```bash
npm test          # doit passer à 100 %
npm run build     # doit se terminer sans erreur
```

Vérifier que `dist/index.html` ne contient aucun `<script>` inline exécutable
(hors `type="application/ld+json"`).

## Versioning (semver)

Le projet suit [Semantic Versioning](https://semver.org/lang/fr/) :

| Incrément | Quand |
|-----------|-------|
| **patch** `0.1.x` | Correctif de bug, hotfix CSP, mise à jour de dépendance mineure |
| **minor** `0.x.0` | Nouvelle fonctionnalité (mode, palette, amélioration WASM) |
| **major** `x.0.0` | Refonte majeure ou changement incompatible |

### Processus de release

```bash
# 1. Sur une branche release/
git checkout -b release/v0.2.0 origin/main

# 2. Bumper la version (modifie package.json + crée un commit)
npm version minor --no-git-tag-version
git add package.json package-lock.json
git commit -m "release: v0.2.0"

# 3. PR → merge squash sur main

# 4. Après merge, tagger le commit squashé sur main
git checkout main && git pull origin main
git tag v0.2.0
git push origin v0.2.0
# → GitHub Actions crée automatiquement la Release avec les notes générées
```

> `--no-git-tag-version` empêche `npm version` de créer le tag localement —
> on le crée manuellement après le merge pour qu'il pointe sur le squash commit.

## Mettre à jour le moteur WASM

Le binaire WASM n'est plus commité dans ce repo. Pour passer à une nouvelle
version publiée sur npm :

```bash
npm install @dyscolor/syllabify-fr-wasm@x.y.z
# commiter uniquement package.json et package-lock.json via une PR
```

## Déploiement

- **Continu** : chaque push sur `main` déclenche `deploy-prod.yml` → CloudFront (~1-5 min)
- **Release** : chaque tag `v*.*.*` déclenche `release.yml` → GitHub Release avec notes auto

Ne jamais lancer `npm run deploy` manuellement sauf urgence absolue.
