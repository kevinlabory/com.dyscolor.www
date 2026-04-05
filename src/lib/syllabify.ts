// @ts-ignore — hypher is a CJS module without bundled types
import Hypher from 'hypher';
// @ts-ignore
import fr from 'hyphenation.fr';

const engine = new Hypher(fr);

const VOWEL = /[aeiouyàâäéèêëîïôùûüÿœæ]/i;

/**
 * Post-process Hypher output: split any syllable that still contains a
 * doubled consonant (nn, mm, ll, tt, ss, pp, rr, ff, bb, dd, gg, cc).
 *
 * Hypher is a typographic hyphenator — it finds *valid* break points, not
 * necessarily *all* syllable boundaries. Double consonants are the most
 * common miss: "connu" stays whole because one break point (in-connu) is
 * enough for typography, but pedagogy requires in-con-nu.
 *
 * Rule: given a syllable piece, if it contains VCC (same letter twice)V,
 * split between the two identical consonants.
 */
function splitDoubles(piece: string): string[] {
  const match = /([bcdfghjklmnpqrstvwxz])\1/i.exec(piece);
  if (!match) return [piece];

  const left  = piece.slice(0, match.index + 1); // up to and including first consonant
  const right = piece.slice(match.index + 1);     // from second consonant onwards

  // Only split if both sides contain a vowel (avoids splitting consonant clusters
  // at the very start/end of a word where there's no vowel on one side)
  if (!VOWEL.test(left) || !VOWEL.test(right)) return [piece];

  // Recurse in case right side has another double (e.g. "onnamment")
  return [left, ...splitDoubles(right)];
}

/**
 * Split a single word into its syllables.
 * Punctuation attached to the word should be stripped before calling.
 * Returns an array with at least one element.
 */
export function syllabify(word: string): string[] {
  if (!word) return [];
  const raw = engine.hyphenate(word) as string[];
  const pieces = raw.length > 0 ? raw : [word];
  return pieces.flatMap(splitDoubles);
}
