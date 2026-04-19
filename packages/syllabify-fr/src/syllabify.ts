import { VOWEL_GRAPHEMES, CONSONANT_GRAPHEMES, VALID_ONSETS, TERMINAL_PALATALS } from './graphemes.js';

// ─── Grapheme tokenizer ────────────────────────────────────────────────────────

type GUnit = { text: string; kind: 'V' | 'C' };

/**
 * Tokenize a word into a sequence of vowel/consonant grapheme units.
 * Multi-character graphemes (ch, ph, ai, eau…) are matched greedily.
 * Unknown characters (digits, apostrophes) are treated as consonant breaks.
 */
function tokenize(word: string): GUnit[] {
  const units: GUnit[] = [];
  let i = 0;
  const w = word.toLowerCase();

  while (i < w.length) {
    let matched = false;

    // Terminal palatal graphemes (ille, aille, eille, …) are single vowel units
    // ONLY when they constitute the entire remaining string.
    // This correctly handles "fille"→[V:ille], "famille"→[…,V:ille],
    // while "briller" remains normal (remaining at 'i' is "iller", not "ille").
    const tail = w.slice(i);
    for (const p of TERMINAL_PALATALS) {
      if (tail === p) {
        units.push({ text: word.slice(i, i + p.length), kind: 'V' });
        i += p.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const g of VOWEL_GRAPHEMES) {
      if (w.startsWith(g, i)) {
        units.push({ text: word.slice(i, i + g.length), kind: 'V' });
        i += g.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const g of CONSONANT_GRAPHEMES) {
      if (w.startsWith(g, i)) {
        units.push({ text: word.slice(i, i + g.length), kind: 'C' });
        i += g.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Unknown char (digit, punctuation…) — treat as opaque consonant unit
    units.push({ text: word[i]!, kind: 'C' });
    i++;
  }

  return units;
}

// ─── CV syllabification ────────────────────────────────────────────────────────

/**
 * Find vowel positions in a unit array.
 */
function vowelPositions(units: GUnit[]): number[] {
  return units.map((u, i) => (u.kind === 'V' ? i : -1)).filter(i => i !== -1);
}

/**
 * Apply French graphemic CV rules to split a unit array into syllables.
 *
 * Rules (applied between each pair of adjacent vowel groups):
 *  - 0 consonants between V1 and V2 (hiatus): split → V1 | V2
 *  - 1 consonant C: split before C → V1 | C V2
 *  - 2 consonants C1 C2:
 *      • if C1+C2 is a valid onset: split before C1 → V1 | C1C2V2
 *      • otherwise: split between them → V1C1 | C2V2
 *  - 3+ consonants C1..Cn:
 *      • find longest valid onset suffix of C1..Cn
 *      • split before that suffix
 */
function applyCV(units: GUnit[]): string[][] {
  const vpos = vowelPositions(units);
  if (vpos.length === 0) return [units.map(u => u.text)];
  if (vpos.length === 1) return [units.map(u => u.text)];

  const breaks: number[] = []; // indices (in units) where a new syllable starts

  for (let v = 0; v < vpos.length - 1; v++) {
    const v1 = vpos[v]!;
    const v2 = vpos[v + 1]!;

    // Consonant units between v1 and v2
    const consonants: GUnit[] = [];
    for (let j = v1 + 1; j < v2; j++) {
      consonants.push(units[j]!);
    }

    if (consonants.length === 0) {
      // Hiatus — split between the two vowels
      breaks.push(v2);
    } else if (consonants.length === 1) {
      // Single consonant → goes with following vowel
      breaks.push(v1 + 1); // the consonant starts the next syllable
    } else {
      // Multiple consonants — find the valid onset at the end
      const onsetStart = findOnsetStart(consonants);
      const splitAt = v1 + 1 + onsetStart; // position in units[] where new syllable begins
      breaks.push(splitAt);
    }
  }

  // Build syllable slices from break positions
  const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
  const slices: string[][] = [];
  let prev = 0;
  for (const br of uniqueBreaks) {
    if (br > prev) slices.push(units.slice(prev, br).map(u => u.text));
    prev = br;
  }
  slices.push(units.slice(prev).map(u => u.text));
  return slices.filter(s => s.length > 0);
}

/**
 * Given a consonant cluster, return the index (0-based within the cluster)
 * at which the valid onset begins. The onset goes to the next vowel.
 *
 * Strategy: try all suffixes from shortest to longest until we find one
 * that is a valid French onset; default to keeping only the last consonant
 * with the next syllable.
 */
function findOnsetStart(consonants: GUnit[]): number {
  // Try longer onsets first (greedy from the end)
  for (let start = 0; start < consonants.length - 1; start++) {
    const candidate = consonants.slice(start).map(u => u.text.toLowerCase()).join('');
    if (VALID_ONSETS.has(candidate)) return start;
  }
  // Default: last consonant only goes with next syllable
  return consonants.length - 1;
}

// ─── Post-processing ───────────────────────────────────────────────────────────

/**
 * After CV splitting, merge any trailing lone "e" syllable back with the
 * preceding syllable when the preceding syllable ends in a vowel grapheme.
 * This avoids over-splitting words like "une" → "u"+"ne" that should be
 * treated as single graphemic syllables.
 *
 * We do NOT merge when the preceding syllable ends in a consonant (e.g.
 * "clas"+"se" → keep separate, which matches Lire Couleur 6 output).
 *
 * Actually: Lire Couleur 6 DOES keep "clas-se", "bel-le", etc. as separate
 * syllables (the mute 'e' stays in its own syllable). So we keep them split.
 * Only merge when the word would have a single final "e" as the ONLY syllable,
 * i.e. monosyllabic words like "le", "me", "se"… already handled by tokenizer
 * returning one vowel group.
 */

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Split a French word into its pedagogical graphemic syllables.
 *
 * Punctuation attached to the word should be stripped before calling.
 * Returns an array with at least one element (the word itself if no split).
 */
export function syllabify(word: string): string[] {
  if (!word) return [];

  const units = tokenize(word);
  const slices = applyCV(units);

  // Join each slice's grapheme texts back into strings
  return slices.map(s => s.join(''));
}
