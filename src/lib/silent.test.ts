/**
 * Thin smoke-test for the src/lib/silent.ts re-export.
 * Full test suite lives in packages/syllabify-fr/test/silent.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { getSilentIndices } from './silent';

function idx(word: string): number[] {
  return [...getSilentIndices(word)].sort((a, b) => a - b);
}

describe('getSilentIndices (re-export from @dyscolor/syllabify-fr)', () => {
  it('returns empty set for empty string', () => {
    expect(getSilentIndices('')).toEqual(new Set());
  });
  it('marks final t in "chat" as silent', () => {
    expect(idx('chat')).toContain(3);
  });
  it('marks final d in "grand" as silent', () => {
    expect(idx('grand')).toContain(4);
  });
  it('marks final p in "beaucoup" as silent', () => {
    expect(idx('beaucoup')).toContain(7);
  });
  it('marks ent in "parlent" as silent (rule 11)', () => {
    expect(idx('parlent')).toEqual(expect.arrayContaining([4, 5, 6]));
  });
  it('does NOT mark ent in "prudent" (adjective)', () => {
    const i = idx('prudent');
    expect(i).not.toContain(4);
    expect(i).not.toContain(5);
  });
});
