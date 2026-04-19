import { syllables, phonemes } from '@dyscolor/syllabify-fr-wasm';

export const SILENT_COLOR = '#b8b0a0';

export function syllabify(word: string): string[] {
  return syllables(word);
}

export function getSilentIndices(word: string): Set<number> {
  const result = new Set<number>();
  let pos = 0;
  for (const pair of phonemes(word) as Array<[string, string]>) {
    const [code, letters] = pair;
    if (code.startsWith('#')) {
      for (let i = 0; i < letters.length; i++) result.add(pos + i);
    }
    pos += letters.length;
  }
  return result;
}
