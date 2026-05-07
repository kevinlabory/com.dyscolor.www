export const CONFUSABLE_COLOR = '#d97706';
export const CONFUSABLE_PRESETS = ['bdpq', 'mnu', 'tout'] as const;
export type ConfusablePreset = typeof CONFUSABLE_PRESETS[number];

const BDPQ = new Set(['b', 'd', 'p', 'q', 'B', 'D', 'P', 'Q']);
const MNU  = new Set(['m', 'n', 'u', 'M', 'N', 'U']);
const ALL  = new Set([...BDPQ, ...MNU]);

// Fallback pur TS (utilisé par le serveur MCP et les tests).
// Le browser utilise l'implémentation WASM via l'alias Vite @dyscolor/syllabify-fr → engine.ts.
export function getConfusableIndices(word: string, preset: ConfusablePreset): Set<number> {
  if (!word) return new Set();
  const chars = preset === 'bdpq' ? BDPQ : preset === 'mnu' ? MNU : ALL;
  const result = new Set<number>();
  for (let i = 0; i < word.length; i++) {
    if (chars.has(word[i]!)) result.add(i);
  }
  return result;
}
