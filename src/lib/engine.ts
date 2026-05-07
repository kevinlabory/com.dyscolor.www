import { syllables, phonemes, highlightLetters } from '@dyscolor/syllabify-fr-wasm';

export const SILENT_COLOR = '#b8b0a0';
export const CONFUSABLE_COLOR = '#d97706';
export const CONFUSABLE_PRESETS = ['bdpq', 'mnu', 'tout'] as const;
export type ConfusablePreset = typeof CONFUSABLE_PRESETS[number];

export function syllabify(word: string): string[] {
  if (!word) return [];
  return syllables(word);
}

export function getConfusableIndices(word: string, preset: ConfusablePreset): Set<number> {
  if (!word) return new Set();
  if (preset === 'tout') {
    const a = getConfusableIndices(word, 'bdpq');
    const b = getConfusableIndices(word, 'mnu');
    return new Set([...a, ...b]);
  }
  const html = highlightLetters(word, preset);
  const result = new Set<number>();
  let charPos = 0;
  let i = 0;
  while (i < html.length) {
    if (html.startsWith('<span', i)) {
      i = html.indexOf('>', i) + 1;
      result.add(charPos++);
      i = html.indexOf('</span>', i) + 7;
    } else if (html.startsWith('</', i)) {
      i = html.indexOf('>', i) + 1;
    } else if (html[i] === '&') {
      i = html.indexOf(';', i) + 1;
      charPos++;
    } else {
      charPos++;
      i++;
    }
  }
  return result;
}

export function getSilentIndices(word: string): Set<number> {
  const result = new Set<number>();
  let pos = 0;
  for (const pair of phonemes(word) as Array<[string, string]>) {
    const [code, letters] = pair;
    if (code.startsWith('#') || code === 'verb_3p') {
      for (let i = 0; i < letters.length; i++) result.add(pos + i);
    }
    pos += letters.length;
  }
  return result;
}
