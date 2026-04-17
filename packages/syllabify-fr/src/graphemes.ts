/**
 * French grapheme tables for the pedagogical syllabification algorithm.
 *
 * A "grapheme" here is the smallest orthographic unit relevant to syllable
 * structure. Multi-character graphemes (digraphs, trigraphs) must be treated
 * as atomic units so the CV algorithm doesn't split them.
 */

/**
 * Vowel graphemes sorted longest-first so greedy matching works correctly.
 * e.g. "eau" must be matched before "au" or "e".
 */
export const VOWEL_GRAPHEMES: readonly string[] = [
  // Trigraphs
  'eau', 'oeu', 'œu',
  // Digraphs — nasal vowel spellings kept separate from base vowels
  'ai', 'aî', 'au', 'ei', 'eu', 'oê', 'oi', 'oî', 'ou', 'oû', 'ui',
  'æ', 'œ',
  // Single accented/special vowels
  'à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ',
  // Plain vowels
  'a', 'e', 'i', 'o', 'u', 'y',
];

/**
 * Consonant graphemes sorted longest-first.
 * "ch", "ph", "gn", "qu" are treated as single units.
 */
export const CONSONANT_GRAPHEMES: readonly string[] = [
  'ch', 'ph', 'gn', 'qu',
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm',
  'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z',
  'ç',
];

/**
 * Terminal palatal graphemes that must be treated as a single vowel unit,
 * but ONLY when they appear at the very end of the word.
 *
 * "fille" /fij/ → f + [ille] = 1 syllable ✓
 * "famille" → fa + m + [ille] = 2 syllables ✓
 * "oreille" → o + r + [eille] = 2 syllables ✓
 * "taille" → t + [aille] = 1 syllable ✓
 * "grenouille" → gre + n + [ouille] = 2 syllables ✓
 *
 * NOT applied mid-word: "briller" → b+r+i+ll+e+r → "bril"+"ler" ✓
 * (because remaining after 'i' is "iller", not "ille")
 *
 * Sorted longest-first for greedy matching safety.
 */
export const TERMINAL_PALATALS: readonly string[] = [
  'ouilles', 'euilles', 'ailles', 'eilles', 'uilles', 'illes',
  'ouille', 'euille', 'aille', 'eille', 'uille', 'ille',
];

/**
 * Consonant clusters that are valid syllable onsets in French.
 * When two consonants appear between two vowels, and they form one of
 * these clusters, they stay together as the onset of the second syllable
 * (V | CCV) rather than being split (VC | CV).
 *
 * Examples: "é-cri-re" (cr valid), "souf-fler" (fl valid).
 */
export const VALID_ONSETS: ReadonlySet<string> = new Set([
  'bl', 'br',
  'cl', 'cr',
  'dr',
  'fl', 'fr',
  'gl', 'gr',
  'pl', 'pr',
  'tr',
  'vr',
  // With 'ch' and 'ph' as single consonant graphemes, ch+r etc. become 2-unit clusters
  // handled naturally by the algorithm — no need to list them here separately.
]);
