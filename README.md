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
| Framework | [Astro 5](https://astro.build) — site statique |
| Styles | [Tailwind CSS v4](https://tailwindcss.com) |
| Syllabation | [Hypher](https://github.com/bramstein/hypher) + [hyphenation.fr](https://github.com/nicowillis/hyphenation.fr) |
| Infra | [SST v4](https://sst.dev) → AWS S3 + CloudFront (eu-west-3) |
| Police | [Luciole](https://www.luciole-vision.com) (CC-BY 4.0) |

## Développement

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # build statique → dist/
npm run preview   # prévisualiser le build
```

## Déploiement

```bash
npx sst install   # une fois — télécharge le runtime Pulumi
npm run deploy    # → production (www.dyscolor.com)
npm run deploy:dev  # → stage de test isolé
```

L'infrastructure est entièrement définie dans [`sst.config.ts`](./sst.config.ts) :
zone Route 53, distribution CloudFront, certificat ACM, security headers.

Après le premier `sst deploy`, copier les nameservers affichés dans l'output `nameservers` vers OVH (Domaines → dyscolor.com → Serveurs DNS).

## Régénérer l'image OG

```bash
npm run gen:og    # → public/og-image.png (1200×630)
```

## Structure

```
src/
  layouts/    BaseLayout.astro (HTML, SEO, JSON-LD)
  components/ Header.astro · DyscolorApp.astro
  lib/        colorize.ts · syllabify.ts · silent.ts · palettes.ts · types.ts
  styles/     global.css
  pages/      index.astro
public/
  fonts/      Luciole-Regular.woff2 · Luciole-Bold.woff2
  og-image.png · favicon.svg · manifest.webmanifest · robots.txt · llms.txt
scripts/
  generate-og.mjs
sst.config.ts
```

## Licence

MIT
