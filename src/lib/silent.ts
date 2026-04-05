/**
 * Heuristic detection of silent letters for French words.
 *
 * Coverage ~70 % — designed for primary-school pedagogy.
 * Favours precision (few false positives) over recall.
 *
 * Rules implemented:
 *  1. Final bare `e` (no accent) in words with ≥ 2 vowels
 *  2. Silent `h` at position 0
 *  3. Final `z` (always silent in French)
 *  4. Final `x` (almost always silent in French)
 *
 * Deliberately excluded for now (too many exceptions without a dictionary):
 *  - Final s, t, d, p, g, c  →  v2 with override list
 *  - `ent` verb ending       →  v2 (ambiguous with nasal vowels like "souvent")
 */

export const SILENT_COLOR = '#b8b0a0';

const VOWEL_RE = /[aeiouyàâäéèêëîïôùûüÿœæ]/i;

function countVowels(s: string): number {
  return (s.match(/[aeiouyàâäéèêëîïôùûüÿœæ]/gi) ?? []).length;
}

// Short function words whose final 'e' is a pronounced schwa, not a silent mute e.
const SCHWA_WORDS = new Set(['le', 'me', 'se', 'de', 'te', 'ce', 'ne', 'je', 'que', 've', 're']);

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
  if (
    w.endsWith('e') &&
    !SCHWA_WORDS.has(w) &&
    countVowels(w) >= 2
  ) {
    silent.add(len - 1);
  }

  // Rule 2 — silent `h` at start
  if (w[0] === 'h') {
    silent.add(0);
  }

  // Rule 3 — final `z`
  if (w[len - 1] === 'z' && len >= 2) {
    silent.add(len - 1);
  }

  // Rule 4 — final `x`
  if (w[len - 1] === 'x' && len >= 2) {
    silent.add(len - 1);
  }

  return silent;
}
