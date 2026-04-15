/**
 * Heuristic detection of silent letters for French words.
 *
 * Favours precision (few false positives) over exhaustive recall.
 *
 * Rules:
 *  1. Final bare `e` (no accent) in words with ≥ 2 vowels
 *  2. Silent `h` at position 0
 *  3. Final `z` (always silent in French)
 *  4. Final `x` (almost always silent in French)
 *  5. Final `t` (almost always silent — small exceptions list)
 *  6. Final `s` (usually silent — exceptions list for pronounced cases)
 *  7. `-aient` ending: `ent` fully silent (100 % verb form, no false positives)
 *  8. Final `d` (almost always silent — exception: "sud")
 *  9. Final `g` (always silent at primary-school level)
 * 10. Final `p` (almost always silent — small exceptions list)
 *
 * Deliberately excluded (false positive rate too high without a POS tagger):
 *  - `-ent` present tense (parlent ✓ but agent/patient/prudent ✗)
 *  - `-nt` in nasal contexts
 */

export const SILENT_COLOR = '#b8b0a0';

function countVowels(s: string): number {
  return (s.match(/[aeiouyàâäéèêëîïôùûüÿœæ]/gi) ?? []).length;
}

// Short function words whose final 'e' is a pronounced schwa, not a mute e.
const SCHWA_WORDS = new Set(['le', 'me', 'se', 'de', 'te', 'ce', 'ne', 'je', 'que', 've', 're']);

// Words where the final `t` IS pronounced (exceptions to rule 5).
const PRONOUNCED_FINAL_T = new Set(['sept', 'but', 'net', 'brut', 'dot', 'fat', 'kit', 'spot', 'set']);

// Words where the final `s` IS pronounced (exceptions to rule 6).
const PRONOUNCED_FINAL_S = new Set(['fils', 'sens', 'ours', 'mars', 'os', 'vis', 'bus', 'iris', 'bis', 'as']);

// Words where the final `d` IS pronounced (exceptions to rule 8).
const PRONOUNCED_FINAL_D = new Set(['sud']);

// Words where the final `p` IS pronounced (exceptions to rule 10).
const PRONOUNCED_FINAL_P = new Set(['cap', 'gap', 'rap', 'top', 'stop', 'slip', 'clip']);

/**
 * Returns the set of character indices (within `word`) that are silent.
 * `word` should be the bare lexical form — no leading/trailing punctuation.
 */
export function getSilentIndices(word: string): Set<number> {
  const silent = new Set<number>();
  const w = word.toLowerCase();
  const len = w.length;

  if (len <= 1) return silent;

  // Rule 1 — final bare `e` muet
  if (w.endsWith('e') && !SCHWA_WORDS.has(w) && countVowels(w) >= 2) {
    silent.add(len - 1);
  }

  // Rule 2 — silent `h` at start
  if (w[0] === 'h') {
    silent.add(0);
  }

  // Rule 3 — final `z` (always silent)
  if (w[len - 1] === 'z' && len >= 2) {
    silent.add(len - 1);
  }

  // Rule 4 — final `x` (almost always silent)
  if (w[len - 1] === 'x' && len >= 2) {
    silent.add(len - 1);
  }

  // Rule 5 — final `t` (almost always silent in French)
  if (w[len - 1] === 't' && len >= 2 && !PRONOUNCED_FINAL_T.has(w)) {
    silent.add(len - 1);
  }

  // Rule 6 — final `s` (usually silent; exceptions where s is pronounced)
  if (w[len - 1] === 's' && len >= 2 && !PRONOUNCED_FINAL_S.has(w)) {
    silent.add(len - 1);
  }

  // Rule 7 — `-aient` ending: the `ent` part is fully silent.
  // This suffix is EXCLUSIVELY a verb form (3rd pl. imparfait / conditionnel)
  // so there are no false positives.
  // "parlaient" /paʁlɛ/ → ai=/ɛ/, ent=silent
  if (w.endsWith('aient') && len >= 6) {
    silent.add(len - 3); // e
    silent.add(len - 2); // n
    silent.add(len - 1); // t
  }

  // Rule 8 — final `d` (almost always silent in French)
  // "grand" /gʁɑ̃/, "chaud" /ʃo/, "pied" /pje/, "lourd" /luʁ/, "canard", "bord"...
  if (w[len - 1] === 'd' && len >= 2 && !PRONOUNCED_FINAL_D.has(w)) {
    silent.add(len - 1);
  }

  // Rule 9 — final `g` (always silent at primary-school level)
  // "sang" /sɑ̃/, "long" /lɔ̃/, "rang" /ʁɑ̃/, "poing" /pwɛ̃/, "bourg" /buʁ/
  if (w[len - 1] === 'g' && len >= 2) {
    silent.add(len - 1);
  }

  // Rule 10 — final `p` (almost always silent in French)
  // "beaucoup" /boku/, "trop" /tʁo/, "loup" /lu/, "camp" /kɑ̃/, "sirop", "coup"...
  if (w[len - 1] === 'p' && len >= 2 && !PRONOUNCED_FINAL_P.has(w)) {
    silent.add(len - 1);
  }

  return silent;
}
