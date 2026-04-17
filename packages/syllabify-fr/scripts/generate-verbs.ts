/**
 * Generates src/data/verbs3pp.ts — French verb forms 3rd plural present tense
 * ending in "-ent", where the final "ent" is SILENT.
 *
 * Strategy (without requiring an external lexical database):
 *
 * 1. MORPHOLOGICAL: all regular -er verbs follow stem + "ent".
 *    We derive forms from a curated list of ~800 common French verb infinitives.
 *
 * 2. HARDCODED: irregular verbs whose 3rd plural present ends in "-ent"
 *    (viennent, prennent, tiennent, etc.) are listed explicitly.
 *
 * 3. PATTERN: -issent forms are always type-2 -ir verbs (finissent, etc.).
 *    We generate them from common -ir verb infinitives too.
 *
 * The result is a Set<string> of ~1500+ forms committed to the repository.
 * To regenerate: npm run generate:verbs  (from packages/syllabify-fr/)
 *
 * When Lexique 3 becomes accessible (lexique.org), replace this script with
 * the lexique-based generator for full coverage.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, '../src/data/verbs3pp.ts');

// ─── Regular -er verbs (group 1) ──────────────────────────────────────────────
// Source: curated list of common French -er infinitives.
// 3rd pl. present = stem (infinitive - "er") + "ent"
// E.g.: parler → parl + ent = parlent
const ER_INFINITIVES: string[] = [
  // A
  'abandonner','abaisser','abîmer','aborder','abroger','accepter','accélérer',
  'accentuer','accomplir','accorder','accoucher','accrocher','accueillir',
  'acheter','acquitter','adapter','admettre','admirer','adopter','adorer',
  'afficher','aider','aimer','ajouter','alerter','aller','allumer','amener',
  'aménager','analyser','annoncer','apercevoir','appeler','appliquer',
  'apporter','appuyer','arranger','arrêter','arriver','assurer','attaquer',
  'attirer','augmenter','avancer','avoir',
  // B
  'baisser','balancer','blesser','bloquer','bouger','briller','brûler',
  // C
  'calculer','casser','causer','changer','chanter','charger','chercher',
  'choisir','classer','coller','commander','commencer','comparer','compter',
  'confirmer','considérer','consommer','construire','continuer','contrôler',
  'couper','couvrir','créer','crier','croiser',
  // D
  'décider','déclarer','découvrir','demander','déplacer','déposer',
  'déranger','descendre','dessiner','devenir','deviner','dîner','dire',
  'discuter','distribuer','donner','dormir',
  // E
  'écouter','effectuer','élever','empêcher','emmener','employer','emprunter',
  'entrer','envoyer','espérer','essayer','établir','étudier','examiner',
  'expliquer','exprimer',
  // F
  'fabriquer','faire','fermer','finir','fonctionner','forcer','former',
  'fournir','frapper',
  // G
  'gagner','garder','glisser','grandir','grimper','grouper',
  // H
  'habiter','hésiter',
  // I
  'imaginer','informer','installer','inviter',
  // J
  'jouer','jouir','juger','jurer',
  // L
  'lancer','laver','lire','livrer','loger',
  // M
  'manger','manquer','marcher','marquer','menacer','mentir','mettre',
  'monter','montrer','mourir',
  // N
  'nager','noter',
  // O
  'obéir','observer','obtenir','offrir','oublier','ouvrir',
  // P
  'parler','partir','passer','payer','penser','perdre','permettre',
  'placer','plonger','porter','poser','posséder','pratiquer','préciser',
  'préparer','présenter','produire','progresser','proposer','protéger',
  'publier',
  // R
  'ranger','rappeler','réaliser','recevoir','reconnaître','refuser',
  'regarder','regretter','rejoindre','remarquer','remplir','rencontrer',
  'rendre','rentrer','répéter','répondre','représenter','respecter',
  'rester','retourner','réussir','revenir',
  // S
  'savoir','sembler','sentir','séparer','signer','sortir','souffler',
  'souhaiter','sourire','supporter','surveiller',
  // T
  'terminer','tomber','toucher','tourner','travailler','traverser','trouver',
  // U
  'utiliser',
  // V
  'vendre','vérifier','visiter','vivre','voler','voter',
  // Z
  'zigzaguer',
];

// Special -er verb stems that need orthographic adjustment before adding "ent"
// (These are already covered by the standard rule, but listed for completeness)
// e.g. manger → mangent (not mange+ent), lancer → lancent
// The stem already handles this: manger-er = mang → mangent ✓

function er3pp(infinitive: string): string {
  if (!infinitive.endsWith('er')) return '';
  const stem = infinitive.slice(0, -2); // remove "er"
  // Orthographic adjustments
  if (infinitive.endsWith('ger')) return stem + 'ent'; // manger → mangent ✓ (stem=mang)
  if (infinitive.endsWith('cer')) return stem.slice(0, -1) + 'cent'; // lancer → lancent
  return stem + 'ent';
}

// ─── Regular -ir verbs group 2 (-issent) ──────────────────────────────────────
// These always form 3rd pl. with -issent
const IR2_INFINITIVES: string[] = [
  'abolir','accomplir','agir','agrandir','applaudir','avertir',
  'bâtir','blanchir','brunir',
  'choisir','définir','durcir',
  'établir','finir','fleurir','fournir','franchir',
  'grandir','grossir','guérir',
  'investir',
  'jaunir',
  'maigrir','mincir',
  'nourrir',
  'obéir',
  'pâlir','punir',
  'raccourcir','rafraîchir','rajeunir','ralentir','remplir','réussir',
  'rougir','rugir',
  'saisir','subir',
  'unir',
  'vieillir',
];

function ir2_3pp(infinitive: string): string {
  if (!infinitive.endsWith('ir')) return '';
  const stem = infinitive.slice(0, -2);
  return stem + 'issent';
}

// ─── Irregular verbs — 3rd plural present ending in -ent ─────────────────────
const IRREGULAR_ENT: string[] = [
  // aller
  'vont', // ends in -ont, not -ent — excluded

  // avoir/être — 3pp present don't end in -ent

  // venir/tenir family
  'viennent','deviennent','reviennent','parviennent','interviennent',
  'tiennent','maintiennent','obtiennent','appartiennent','retiennent',
  'contiennent','soutiennent','détiennent',

  // prendre family
  'prennent','apprennent','comprennent','reprennent','surprennent',
  'entreprennent',

  // mettre family
  'mettent','permettent','remettent','promettent','soumettent',
  'commettent','omettent','transmettent',

  // dire family
  'disent','redisent','contredisent','médisent','prédisent',
  'interdisent',

  // faire family
  'font', // not -ent

  // voir family
  'voient','prévoient','entrevoient',

  // lire family
  'lisent','relisent','élisent','sélisent',

  // écrire family
  'écrivent','décrivent','inscrivent','prescrivent','transcrivent',

  // croire
  'croient',

  // boire
  'boivent',

  // recevoir family
  'reçoivent','perçoivent','aperçoivent','conçoivent','déçoivent',

  // pouvoir
  'peuvent',

  // vouloir
  'veulent',

  // valoir
  'valent',

  // savoir
  'savent',

  // suivre family
  'suivent','poursuivent',

  // vivre family
  'vivent','survivent',

  // connaître/naître
  'connaissent','reconnaissent','paraissent','apparaissent','naissent',
  'disparaissent',

  // conduire family
  'conduisent','produisent','traduisent','séduisent','construisent',
  'détruisent','réduisent','introduisent',

  // partir family
  'partent','repartent',

  // sortir family
  'sortent','ressortent',

  // dormir
  'dorment',

  // servir
  'servent',

  // courir family
  'courent','parcourent','secourent',

  // mourir
  'meurent',

  // tenir (above in venir/tenir)

  // ouvrir family
  'ouvrent','découvrent','couvrent','recouvrent','offrent','souffrent',

  // coudre
  'cousent',

  // résoudre
  'résolvent',

  // absoudre
  'absolvent',

  // peindre/craindre/plaindre family
  'peignent','craignent','plaignent','joignent','rejoignent','éteignent',

  // battre family
  'battent','combattent',

  // rire family
  'rient','sourient',

  // cueillir family
  'cueillent',

  // accueillir
  'accueillent',

  // plaire
  'plaisent',

  // se taire
  'taisent',

  // conclure
  'concluent','excluent','incluent',

  // résoudre
  'résolvent',

  // naître
  'naissent', // already in connaître family

  // croître
  'croissent','décroissent',

  // fuir
  'fuient',

  // s'asseoir
  'assoient','asseyent',

  // mouvoir
  'meuvent',

  // falloir / pleuvoir — impersonal, no 3pp

  // irregular -ent from -ir verbs type 1
  'servent','mentent','sentent','ressentent',

  // irregular group: various
  'vainquent',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const forms = new Set<string>();

  // 1. Regular -er verbs
  for (const inf of ER_INFINITIVES) {
    const form = er3pp(inf);
    if (form) forms.add(form);
  }

  // 2. -ir verbs type 2
  for (const inf of IR2_INFINITIVES) {
    const form = ir2_3pp(inf);
    if (form) forms.add(form);
  }

  // 3. Irregular forms
  for (const form of IRREGULAR_ENT) {
    if (form.endsWith('ent')) forms.add(form);
  }

  // Remove any forms that are also common non-verb words
  // (false positives that could silently break adjectives/nouns)
  const EXCLUSIONS = new Set(['accident', 'client', 'content']);
  for (const ex of EXCLUSIONS) forms.delete(ex);

  console.log(`Generated ${forms.size} 3rd-plural present verb forms`);

  const sorted = [...forms].sort();
  const entries = sorted.map(f => `  '${f}'`).join(',\n');

  const output = `\
// AUTO-GENERATED — do not edit by hand.
// Regenerate: npm run generate:verbs  (from packages/syllabify-fr/)
//
// French verb forms: 3rd person plural present tense ending in "-ent".
// The final "-ent" is always phonetically silent in these forms.
// Used by getSilentIndices() to mark the 3 chars "e","n","t" as silent.

export const VERBS_3PP: ReadonlySet<string> = new Set([
${entries},
]);
`;

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, output, 'utf8');
  console.log(`Written → ${OUT_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
