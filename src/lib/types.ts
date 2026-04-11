export type ColorizeMode = 'syllabe' | 'mot' | 'ligne';

export type PaletteKey = 'doux' | 'classique' | 'violet';

export interface Token {
  type: 'word' | 'space' | 'newline';
  value: string;
}

// ── Structured analysis types (renderer-agnostic) ────────────────────────────

/**
 * One atomic piece of output: a syllable, a whole word, a line, or a
 * passthrough token (space, punctuation prefix/suffix).
 *
 * color === null  → passthrough: render without a color attribute
 * color !== null  → apply this hex color to the text
 *
 * silentIndices contains character positions *local to this piece* (0-based)
 * that should be rendered with SILENT_COLOR instead of `color`.
 */
export interface AnalyzedPiece {
  text: string;
  color: string | null;
  silentIndices: number[];
}

/**
 * A single token from the input together with its analyzed pieces.
 * `pieces` is always present (empty array for space/newline tokens).
 */
export interface AnalyzedToken {
  type: 'word' | 'space' | 'newline' | 'line';
  raw: string;
  pieces: AnalyzedPiece[];
}

/**
 * The complete result of analyze(): everything a renderer needs.
 * Carrying `colors` and `silentColor` here makes the structure
 * self-describing — consumers don't need to re-import palettes.ts.
 */
export interface AnalyzedText {
  mode: ColorizeMode;
  palette: PaletteKey;
  colors: [string, string];
  silentColor: string;
  tokens: AnalyzedToken[];
}
