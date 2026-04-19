import { describe, it, expect } from 'vitest';
import { syllabify, getSilentIndices } from './engine';

describe('syllabify — moteur Rust LC6', () => {
  it('famille → fa|mi|lle', () => expect(syllabify('famille')).toEqual(['fa', 'mi', 'lle']));
  it('fille → fi|lle', () => expect(syllabify('fille')).toEqual(['fi', 'lle']));
  it('oreille → o|re|ille', () => expect(syllabify('oreille')).toEqual(['o', 're', 'ille']));
  it('école → é|co|le', () => expect(syllabify('école')).toEqual(['é', 'co', 'le']));
  it('histoire → his|toi|re', () => expect(syllabify('histoire')).toEqual(['his', 'toi', 're']));
  it('apprennent → ap|pren|nent', () => expect(syllabify('apprennent')).toEqual(['ap', 'pren', 'nent']));
  it('parlent → par|lent', () => expect(syllabify('parlent')).toEqual(['par', 'lent']));
  it('grand → grand (monosyllabe)', () => expect(syllabify('grand')).toEqual(['grand']));
  it('beaucoup → beau|coup', () => expect(syllabify('beaucoup')).toEqual(['beau', 'coup']));
  it('maîtresse → maî|tres|se', () => expect(syllabify('maîtresse')).toEqual(['maî', 'tres', 'se']));
  it('silence → si|len|ce', () => expect(syllabify('silence')).toEqual(['si', 'len', 'ce']));
  it('chaîne vide → []', () => expect(syllabify('')).toEqual([]));
});

describe('getSilentIndices — phonèmes muets Rust', () => {
  it('grand : d muet → {4}', () => expect(getSilentIndices('grand')).toEqual(new Set([4])));
  it('beaucoup : p muet → {7}', () => expect(getSilentIndices('beaucoup')).toEqual(new Set([7])));
  it('histoire : h muet → {0}', () => expect(getSilentIndices('histoire')).toEqual(new Set([0])));
  it('parlent : nt muet (verb_3p) → {5,6}', () => expect(getSilentIndices('parlent')).toEqual(new Set([5, 6])));
  it('famille : aucune lettre muette', () => expect(getSilentIndices('famille')).toEqual(new Set()));
  it('école : aucune lettre muette', () => expect(getSilentIndices('école')).toEqual(new Set()));
});
