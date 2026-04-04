// @ts-ignore — hypher is a CJS module without bundled types
import Hypher from 'hypher';
// @ts-ignore
import fr from 'hyphenation.fr';

const engine = new Hypher(fr);

/**
 * Split a single word into its syllables.
 * Punctuation attached to the word should be stripped before calling.
 * Returns an array with at least one element.
 */
export function syllabify(word: string): string[] {
  if (!word) return [];
  const syllables = engine.hyphenate(word) as string[];
  return syllables.length > 0 ? syllables : [word];
}
