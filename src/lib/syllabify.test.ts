/**
 * Thin smoke-test for the src/lib/syllabify.ts re-export.
 * Full test suite lives in packages/syllabify-fr/test/syllabify.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { syllabify } from './syllabify';

describe('syllabify (re-export from @dyscolor/syllabify-fr)', () => {
  it('returns [] for empty string', () => {
    expect(syllabify('')).toEqual([]);
  });
  it('splits chocolat: cho|co|lat', () => {
    expect(syllabify('chocolat')).toEqual(['cho', 'co', 'lat']);
  });
  it('splits histoire: his|toi|re', () => {
    expect(syllabify('histoire')).toEqual(['his', 'toi', 're']);
  });
  it('splits école: é|co|le', () => {
    expect(syllabify('école')).toEqual(['é', 'co', 'le']);
  });
  it('splits famille: fa|mille', () => {
    expect(syllabify('famille')).toEqual(['fa', 'mille']);
  });
  it('splits fille as single syllable', () => {
    expect(syllabify('fille')).toEqual(['fille']);
  });
  it('splits apprennent: ap|pren|nent', () => {
    expect(syllabify('apprennent')).toEqual(['ap', 'pren', 'nent']);
  });
});
