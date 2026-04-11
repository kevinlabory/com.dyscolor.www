import { describe, it, expect } from 'vitest';
import { syllabify } from './syllabify';

describe('syllabify', () => {
  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('returns [] for empty string', () => {
    expect(syllabify('')).toEqual([]);
  });

  it('returns single-element array for one-letter word', () => {
    expect(syllabify('a')).toEqual(['a']);
  });

  // ── Standard French words (Hypher) ─────────────────────────────────────────

  it('splits chocolat into 3 syllables', () => {
    expect(syllabify('chocolat')).toEqual(['cho', 'co', 'lat']);
  });

  it('splits petit into 2 syllables', () => {
    expect(syllabify('petit')).toEqual(['pe', 'tit']);
  });

  it('splits bonjour into 2 syllables', () => {
    expect(syllabify('bonjour')).toEqual(['bon', 'jour']);
  });

  it('splits parler into 2 syllables', () => {
    expect(syllabify('parler')).toEqual(['par', 'ler']);
  });

  it('splits chanter into 2 syllables', () => {
    expect(syllabify('chanter')).toEqual(['chan', 'ter']);
  });

  // ── Double consonants — split between them ─────────────────────────────────

  it('splits connu on nn', () => {
    expect(syllabify('connu')).toEqual(['con', 'nu']);
  });

  it('splits pomme on mm', () => {
    expect(syllabify('pomme')).toEqual(['pom', 'me']);
  });

  it('splits belle on ll', () => {
    expect(syllabify('belle')).toEqual(['bel', 'le']);
  });

  it('splits attendre on tt', () => {
    expect(syllabify('attendre')).toEqual(['at', 'tendre']);
  });

  it('splits commun on mm', () => {
    expect(syllabify('commun')).toEqual(['com', 'mun']);
  });

  // ── Double consonant with no adjacent vowel — must NOT split ───────────────

  it('does not split bare "mm" (no vowel on either side)', () => {
    // splitDoubles requires a vowel on both sides; pure consonant clusters stay whole
    expect(syllabify('mm')).toEqual(['mm']);
  });

  // ── Words with accented vowels ─────────────────────────────────────────────

  it('keeps étoile as one piece when no break found', () => {
    expect(syllabify('étoile')).toEqual(['étoile']);
  });

  it('keeps école as one piece when no break found', () => {
    expect(syllabify('école')).toEqual(['école']);
  });
});
