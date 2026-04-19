import { describe, it, expect } from 'vitest';
import { getSilentIndices } from '../src/silent.js';

function idx(word: string): number[] {
  return [...getSilentIndices(word)].sort((a, b) => a - b);
}

describe('getSilentIndices', () => {

  it('returns empty set for empty string', () => {
    expect(getSilentIndices('')).toEqual(new Set());
  });

  // ── Rule 1 — final bare e muet ────────────────────────────────────────────
  it('marks final e in "école" as silent', () => expect(idx('école')).toContain(4));
  it('marks final e in "pomme" as silent', () => expect(idx('pomme')).toContain(4));
  it('does NOT mark e in SCHWA_WORDS', () => {
    for (const w of ['le', 'me', 'de', 'se', 'te', 'ce', 'ne', 'je', 'que']) {
      expect(idx(w)).not.toContain(w.length - 1);
    }
  });

  // ── Rule 2 — silent h at start ────────────────────────────────────────────
  it('marks initial h in "homme" as silent', () => expect(idx('homme')).toContain(0));
  it('marks initial h in "histoire" as silent', () => expect(idx('histoire')).toContain(0));

  // ── Rule 3 — final z ──────────────────────────────────────────────────────
  it('marks final z in "nez"', () => expect(idx('nez')).toContain(2));
  it('marks final z in "assez"', () => expect(idx('assez')).toContain(4));

  // ── Rule 4 — final x ──────────────────────────────────────────────────────
  it('marks final x in "deux"', () => expect(idx('deux')).toContain(3));
  it('marks final x in "voix"', () => expect(idx('voix')).toContain(3));

  // ── Rule 5 — final t ──────────────────────────────────────────────────────
  it('marks final t in "chat"', () => expect(idx('chat')).toContain(3));
  it('marks final t in "petit"', () => expect(idx('petit')).toContain(4));
  it('does NOT mark t in PRONOUNCED_FINAL_T', () => {
    for (const w of ['sept', 'but', 'net', 'brut', 'kit', 'spot']) {
      expect(idx(w)).not.toContain(w.length - 1);
    }
  });

  // ── Rule 6 — final s ──────────────────────────────────────────────────────
  it('marks final s in "chats"', () => expect(idx('chats')).toContain(4));
  it('marks final s in "temps"', () => expect(idx('temps')).toContain(4));
  it('does NOT mark s in PRONOUNCED_FINAL_S', () => {
    for (const w of ['fils', 'sens', 'ours', 'mars', 'os']) {
      expect(idx(w)).not.toContain(w.length - 1);
    }
  });

  // ── Rule 7 — -aient ending ────────────────────────────────────────────────
  it('marks ent in "parlaient": indices 6,7,8', () => {
    // p-a-r-l-a-i-e-n-t → len=9
    expect(idx('parlaient')).toEqual(expect.arrayContaining([6, 7, 8]));
  });

  // ── Rule 8 — final d ──────────────────────────────────────────────────────
  it('marks final d in "grand"', () => expect(idx('grand')).toContain(4));
  it('marks final d in "chaud"', () => expect(idx('chaud')).toContain(4));
  it('marks final d in "pied"', () => expect(idx('pied')).toContain(3));
  it('does NOT mark d in "sud"', () => expect(idx('sud')).not.toContain(2));

  // ── Rule 9 — final g ──────────────────────────────────────────────────────
  it('marks final g in "sang"', () => expect(idx('sang')).toContain(3));
  it('marks final g in "long"', () => expect(idx('long')).toContain(3));

  // ── Rule 10 — final p ─────────────────────────────────────────────────────
  it('marks final p in "beaucoup"', () => expect(idx('beaucoup')).toContain(7));
  it('marks final p in "trop"', () => expect(idx('trop')).toContain(3));
  it('marks final p in "loup"', () => expect(idx('loup')).toContain(3));
  it('does NOT mark p in PRONOUNCED_FINAL_P', () => {
    for (const w of ['cap', 'gap', 'rap', 'top', 'stop']) {
      expect(idx(w)).not.toContain(w.length - 1);
    }
  });

  // ── Rule 11 — -ent 3rd plural present ────────────────────────────────────
  it('marks ent in "parlent" as silent', () => {
    // p-a-r-l-e-n-t → len=7, ent at indices 4,5,6
    const i = idx('parlent');
    expect(i).toContain(4);
    expect(i).toContain(5);
    expect(i).toContain(6);
  });
  it('marks ent in "mangent" as silent', () => {
    const i = idx('mangent');
    expect(i).toContain(4);
    expect(i).toContain(5);
    expect(i).toContain(6);
  });
  it('marks ent in "apprennent" as silent', () => {
    // a-p-p-r-e-n-n-e-n-t → len=10, ent at 7,8,9
    const i = idx('apprennent');
    expect(i).toContain(7);
    expect(i).toContain(8);
    expect(i).toContain(9);
  });
  it('marks ent in "écoutent" as silent', () => {
    // é-c-o-u-t-e-n-t → len=8, ent at 5,6,7
    const i = idx('écoutent');
    expect(i).toContain(5);
    expect(i).toContain(6);
    expect(i).toContain(7);
  });
  it('does NOT mark ent in "prudent" (adjective)', () => {
    // p-r-u-d-e-n-t → len=7
    const i = idx('prudent');
    expect(i).not.toContain(4); // e
    expect(i).not.toContain(5); // n
    // (rule 5 marks t=6 as silent, that's correct)
  });
  it('does NOT mark ent in "agent" (noun)', () => {
    const i = idx('agent');
    expect(i).not.toContain(2); // e
    expect(i).not.toContain(3); // n
  });
  it('does NOT mark ent in "violent" (adjective)', () => {
    const i = idx('violent');
    expect(i).not.toContain(4);
    expect(i).not.toContain(5);
  });

});
