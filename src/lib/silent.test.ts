import { describe, it, expect } from 'vitest';
import { getSilentIndices } from './silent';

/** Helper: convert Set to sorted array for readable assertions. */
function indices(word: string): number[] {
  return [...getSilentIndices(word)].sort((a, b) => a - b);
}

describe('getSilentIndices', () => {
  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('returns empty set for empty string', () => {
    expect(getSilentIndices('')).toEqual(new Set());
  });

  it('returns empty set for single-character word', () => {
    expect(getSilentIndices('a')).toEqual(new Set());
    expect(getSilentIndices('e')).toEqual(new Set());
  });

  // ── Rule 1 — final bare `e` muet ───────────────────────────────────────────

  it('Rule 1: marks final e in "école" as silent', () => {
    // é-c-o-l-e → index 4
    expect(indices('école')).toContain(4);
  });

  it('Rule 1: marks final e in "pomme" as silent', () => {
    // p-o-m-m-e → index 4
    expect(indices('pomme')).toContain(4);
  });

  it('Rule 1: marks final e in "belle" as silent', () => {
    // b-e-l-l-e → index 4
    expect(indices('belle')).toContain(4);
  });

  it('Rule 1: does NOT mark final e in SCHWA_WORDS (le, me, de, se, te, ce, ne, je, que)', () => {
    for (const w of ['le', 'me', 'de', 'se', 'te', 'ce', 'ne', 'je', 'que']) {
      expect(indices(w)).not.toContain(w.length - 1);
    }
  });

  it('Rule 1: does NOT mark final e in words with only 1 vowel', () => {
    // "tre" has only one vowel group ('e'), so it doesn't have ≥ 2 vowels
    // Actually 'e' is the only vowel, countVowels('tre') = 1 → no silent e
    expect(indices('tre')).not.toContain(2);
  });

  // ── Rule 2 — silent `h` at position 0 ─────────────────────────────────────

  it('Rule 2: marks initial h in "héros" as silent', () => {
    expect(indices('héros')).toContain(0);
  });

  it('Rule 2: marks initial h in "homme" as silent', () => {
    expect(indices('homme')).toContain(0);
  });

  it('Rule 2: does NOT mark h when not at position 0', () => {
    // "cahier" — h is at index 2, not 0
    const idx = indices('cahier');
    expect(idx).not.toContain(0);
    // (might mark final e but not h at index 0)
  });

  // ── Rule 3 — final `z` ─────────────────────────────────────────────────────

  it('Rule 3: marks final z in "nez" as silent', () => {
    // n-e-z → index 2
    expect(indices('nez')).toContain(2);
  });

  it('Rule 3: marks final z in "chez" as silent', () => {
    // c-h-e-z → index 3
    expect(indices('chez')).toContain(3);
  });

  it('Rule 3: marks final z in "assez" as silent', () => {
    expect(indices('assez')).toContain(4);
  });

  // ── Rule 4 — final `x` ─────────────────────────────────────────────────────

  it('Rule 4: marks final x in "paix" as silent', () => {
    // p-a-i-x → index 3
    expect(indices('paix')).toContain(3);
  });

  it('Rule 4: marks final x in "deux" as silent', () => {
    // d-e-u-x → index 3
    expect(indices('deux')).toContain(3);
  });

  it('Rule 4: does NOT mark x for single-char word "x"', () => {
    // len < 2, rule skipped
    expect(indices('x')).toEqual([]);
  });

  // ── Rule 5 — final `t` ─────────────────────────────────────────────────────

  it('Rule 5: marks final t in "chat" as silent', () => {
    // c-h-a-t → index 3
    expect(indices('chat')).toContain(3);
  });

  it('Rule 5: marks final t in "petit" as silent', () => {
    // p-e-t-i-t → index 4
    expect(indices('petit')).toContain(4);
  });

  it('Rule 5: marks final t in "mot" as silent', () => {
    expect(indices('mot')).toContain(2);
  });

  it('Rule 5: exceptions — does NOT mark final t in PRONOUNCED_FINAL_T', () => {
    for (const w of ['sept', 'but', 'net', 'brut', 'dot', 'fat', 'kit', 'spot', 'set']) {
      expect(indices(w)).not.toContain(w.length - 1);
    }
  });

  // ── Rule 6 — final `s` ─────────────────────────────────────────────────────

  it('Rule 6: marks final s in "chats" as silent', () => {
    // c-h-a-t-s → index 4
    expect(indices('chats')).toContain(4);
  });

  it('Rule 6: marks final s in "pois" as silent', () => {
    // p-o-i-s → index 3
    expect(indices('pois')).toContain(3);
  });

  it('Rule 6: marks final s in "temps" as silent', () => {
    expect(indices('temps')).toContain(4);
  });

  it('Rule 6: exceptions — does NOT mark final s in PRONOUNCED_FINAL_S', () => {
    for (const w of ['fils', 'sens', 'ours', 'mars', 'os', 'vis', 'bus', 'iris', 'bis', 'as']) {
      expect(indices(w)).not.toContain(w.length - 1);
    }
  });

  // ── Rule 7 — `-aient` ending ───────────────────────────────────────────────

  it('Rule 7: marks ent in "parlaient" as silent (3 chars: e, n, t)', () => {
    // p-a-r-l-a-i-e-n-t → len=9, ent = indices 6,7,8
    const idx = indices('parlaient');
    expect(idx).toContain(6);
    expect(idx).toContain(7);
    expect(idx).toContain(8);
  });

  it('Rule 7: marks ent in "mangeaient" as silent', () => {
    // m-a-n-g-e-a-i-e-n-t → len=10, ent = indices 7,8,9
    const idx = indices('mangeaient');
    expect(idx).toContain(7);
    expect(idx).toContain(8);
    expect(idx).toContain(9);
  });

  it('Rule 7: does NOT apply to "client" (ends in ient, not aient)', () => {
    const idx = indices('client');
    // final t would only be marked by rule 5, not ent block by rule 7
    // rule 7 checks endsWith('aient'), 'client' ends with 'lient'
    expect(idx).not.toContain(3); // 'i'
    expect(idx).not.toContain(4); // 'e'
  });

  it('Rule 7: does NOT apply to "patient"', () => {
    const idx = indices('patient');
    // 'patient' ends in 'ient', not 'aient'
    expect(idx).not.toContain(4); // 'i'
    expect(idx).not.toContain(5); // 'e'
  });

  // ── Rule 8 — final `d` ─────────────────────────────────────────────────────

  it('Rule 8: marks final d in "grand" as silent', () => {
    // g-r-a-n-d → index 4
    expect(indices('grand')).toContain(4);
  });

  it('Rule 8: marks final d in "chaud" as silent', () => {
    // c-h-a-u-d → index 4
    expect(indices('chaud')).toContain(4);
  });

  it('Rule 8: marks final d in "pied" as silent', () => {
    // p-i-e-d → index 3
    expect(indices('pied')).toContain(3);
  });

  it('Rule 8: marks final d in "lourd" as silent', () => {
    // l-o-u-r-d → index 4
    expect(indices('lourd')).toContain(4);
  });

  it('Rule 8: exception — does NOT mark final d in "sud"', () => {
    expect(indices('sud')).not.toContain(2);
  });

  // ── Rule 9 — final `g` ─────────────────────────────────────────────────────

  it('Rule 9: marks final g in "sang" as silent', () => {
    // s-a-n-g → index 3
    expect(indices('sang')).toContain(3);
  });

  it('Rule 9: marks final g in "long" as silent', () => {
    // l-o-n-g → index 3
    expect(indices('long')).toContain(3);
  });

  it('Rule 9: marks final g in "rang" as silent', () => {
    // r-a-n-g → index 3
    expect(indices('rang')).toContain(3);
  });

  // ── Rule 10 — final `p` ────────────────────────────────────────────────────

  it('Rule 10: marks final p in "beaucoup" as silent', () => {
    // b-e-a-u-c-o-u-p → index 7
    expect(indices('beaucoup')).toContain(7);
  });

  it('Rule 10: marks final p in "trop" as silent', () => {
    // t-r-o-p → index 3
    expect(indices('trop')).toContain(3);
  });

  it('Rule 10: marks final p in "loup" as silent', () => {
    // l-o-u-p → index 3
    expect(indices('loup')).toContain(3);
  });

  it('Rule 10: marks final p in "camp" as silent', () => {
    // c-a-m-p → index 3
    expect(indices('camp')).toContain(3);
  });

  it('Rule 10: exceptions — does NOT mark final p in PRONOUNCED_FINAL_P', () => {
    for (const w of ['cap', 'gap', 'rap', 'top', 'stop', 'slip', 'clip']) {
      expect(indices(w)).not.toContain(w.length - 1);
    }
  });

  // ── Cumulative / multi-rule ────────────────────────────────────────────────

  it('cumul: "hommes" activates rules 2 (initial h) and 6 (final s)', () => {
    // h-o-m-m-e-s → len=6
    // Rule 2: index 0 (h)
    // Rule 6: index 5 (s) — "hommes" is not in PRONOUNCED_FINAL_S
    // Rule 1 does NOT apply: the word ends in 's', not 'e'
    expect(indices('hommes')).toEqual([0, 5]);
  });

  it('cumul: "parlaient" activates rule 1 (final e silent via aient) and rule 7', () => {
    // Check that all three indices for aient are present
    const idx = indices('parlaient');
    // len=9: a(0)i(1) at end = no, the word is p-a-r-l-a-i-e-n-t
    // Rule 7: e=6, n=7, t=8
    expect(idx).toContain(6);
    expect(idx).toContain(7);
    expect(idx).toContain(8);
  });
});
