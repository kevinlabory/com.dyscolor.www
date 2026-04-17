import { describe, it, expect } from 'vitest';
import { syllabify } from '../src/syllabify.js';

describe('syllabify', () => {

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('returns [] for empty string', () => expect(syllabify('')).toEqual([]));
  it('returns one element for a single vowel', () => expect(syllabify('a')).toEqual(['a']));

  // ── Words from Lire Couleur 6 comparison ─────────────────────────────────

  it('splits histoire correctly: his|toi|re', () => {
    expect(syllabify('histoire')).toEqual(['his', 'toi', 're']);
  });
  it('splits élèves correctly: é|lè|ves', () => {
    expect(syllabify('élèves')).toEqual(['é', 'lè', 'ves']);
  });
  it('splits silence correctly: si|len|ce', () => {
    expect(syllabify('silence')).toEqual(['si', 'len', 'ce']);
  });
  it('splits difficiles correctly: dif|fi|ci|les', () => {
    expect(syllabify('difficiles')).toEqual(['dif', 'fi', 'ci', 'les']);
  });
  it('splits reconnaître correctly: re|con|naî|tre', () => {
    expect(syllabify('reconnaître')).toEqual(['re', 'con', 'naî', 'tre']);
  });
  it('splits Ensemble correctly: En|sem|ble', () => {
    expect(syllabify('Ensemble')).toEqual(['En', 'sem', 'ble']);
  });
  it('splits apprennent correctly: ap|pren|nent', () => {
    expect(syllabify('apprennent')).toEqual(['ap', 'pren', 'nent']);
  });
  it('splits écoutent correctly: é|cou|tent', () => {
    expect(syllabify('écoutent')).toEqual(['é', 'cou', 'tent']);
  });
  it('splits maîtresse correctly: maî|tres|se', () => {
    expect(syllabify('maîtresse')).toEqual(['maî', 'tres', 'se']);
  });

  // ── Standard French words ─────────────────────────────────────────────────

  it('splits chocolat: cho|co|lat', () => {
    expect(syllabify('chocolat')).toEqual(['cho', 'co', 'lat']);
  });
  it('splits parler: par|ler', () => {
    expect(syllabify('parler')).toEqual(['par', 'ler']);
  });
  it('splits bonjour: bon|jour', () => {
    expect(syllabify('bonjour')).toEqual(['bon', 'jour']);
  });
  it('splits chanter: chan|ter', () => {
    expect(syllabify('chanter')).toEqual(['chan', 'ter']);
  });
  it('splits classe: clas|se', () => {
    expect(syllabify('classe')).toEqual(['clas', 'se']);
  });
  it('splits salle: sal|le', () => {
    expect(syllabify('salle')).toEqual(['sal', 'le']);
  });
  it('splits travailler: tra|vail|ler', () => {
    expect(syllabify('travailler')).toEqual(['tra', 'vail', 'ler']);
  });
  it('splits haute: hau|te', () => {
    expect(syllabify('haute')).toEqual(['hau', 'te']);
  });
  it('splits voix as single syllable', () => {
    expect(syllabify('voix')).toEqual(['voix']);
  });

  // ── é-initial fallback ────────────────────────────────────────────────────

  it('splits école: é|co|le', () => {
    expect(syllabify('école')).toEqual(['é', 'co', 'le']);
  });
  it('splits étoile: é|toi|le', () => {
    expect(syllabify('étoile')).toEqual(['é', 'toi', 'le']);
  });

  // ── Valid consonant onsets (pr, br, tr, etc.) ─────────────────────────────

  it('keeps "tr" as onset: é|cri|re', () => {
    expect(syllabify('écrire')).toEqual(['é', 'cri', 're']);
  });
  it('keeps "pr" as onset: com|pren|dre', () => {
    expect(syllabify('comprendre')).toEqual(['com', 'pren', 'dre']);
  });

  // ── Terminal palatal grapheme "ille" (/ij/) ───────────────────────────────

  it('fille is monosyllabic: [fille]', () => {
    expect(syllabify('fille')).toEqual(['fille']);
  });
  it('ville is monosyllabic: [ville]', () => {
    expect(syllabify('ville')).toEqual(['ville']);
  });
  it('grille is monosyllabic: [grille]', () => {
    expect(syllabify('grille')).toEqual(['grille']);
  });
  it('famille splits correctly: fa|mille', () => {
    expect(syllabify('famille')).toEqual(['fa', 'mille']);
  });
  it('oreille splits correctly: o|reille', () => {
    expect(syllabify('oreille')).toEqual(['o', 'reille']);
  });
  it('taille is monosyllabic: [taille]', () => {
    expect(syllabify('taille')).toEqual(['taille']);
  });
  it('grenouille splits correctly: gre|nouille', () => {
    expect(syllabify('grenouille')).toEqual(['gre', 'nouille']);
  });
  it('belle still splits on ll: bel|le (not "ille")', () => {
    expect(syllabify('belle')).toEqual(['bel', 'le']);
  });
  it('briller still splits: bril|ler (mid-word ll, not terminal)', () => {
    expect(syllabify('briller')).toEqual(['bril', 'ler']);
  });

  // ── Double consonants ─────────────────────────────────────────────────────

  it('splits connu: con|nu', () => {
    expect(syllabify('connu')).toEqual(['con', 'nu']);
  });
  it('splits pomme: pom|me', () => {
    expect(syllabify('pomme')).toEqual(['pom', 'me']);
  });
  it('splits attendre: at|ten|dre', () => {
    expect(syllabify('attendre')).toEqual(['at', 'ten', 'dre']);
  });

});
