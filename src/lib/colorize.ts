import { analyze } from './analyze';
import type { ConfusablePreset } from './engine';
import type { ColorizeMode, PaletteKey, AnalyzedText, AnalyzedPiece } from './types';

// ---------------------------------------------------------------------------
// HTML renderer
// ---------------------------------------------------------------------------

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render one piece to an HTML string.
 * - color === null → passthrough <span> with no style
 * - silentIndices non-empty → split into runs of main color vs silent color
 */
function renderPiece(piece: AnalyzedPiece, silentColor: string, confusableColor: string): string {
  const { text, color, silentIndices, confusableIndices } = piece;

  if (color === null) {
    return `<span>${escape(text)}</span>`;
  }

  if (silentIndices.length === 0 && confusableIndices.length === 0) {
    return `<span style="color:${color}">${escape(text)}</span>`;
  }

  // Merge adjacent characters that share the same color into one span.
  // Priority: silent > confusable > syllable color.
  const silentSet = new Set(silentIndices);
  const confusableSet = new Set(confusableIndices);
  const charColor = (i: number) =>
    silentSet.has(i) ? silentColor : confusableSet.has(i) ? confusableColor : color;

  let result = '';
  let i = 0;
  while (i < text.length) {
    const runColor = charColor(i);
    let run = text[i]!;
    let j = i + 1;
    while (j < text.length && charColor(j) === runColor) {
      run += text[j]!;
      j++;
    }
    result += `<span style="color:${runColor}">${escape(run)}</span>`;
    i = j;
  }
  return result;
}

function renderHTML(analyzed: AnalyzedText): string {
  const { tokens, silentColor, confusableColor } = analyzed;
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type === 'newline') {
      parts.push('<br>');
      continue;
    }

    if (token.type === 'line') {
      const piece = token.pieces[0]!;
      const escaped = piece.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      parts.push(`<div style="color:${piece.color}">${escaped || '&nbsp;'}</div>`);
      continue;
    }

    if (token.type === 'space') {
      parts.push(`<span>${escape(token.raw)}</span>`);
      continue;
    }

    // word token — render each piece
    for (const piece of token.pieces) {
      parts.push(renderPiece(piece, silentColor, confusableColor));
    }
  }

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Public API (signature unchanged)
// ---------------------------------------------------------------------------

export function colorizeText(
  input: string,
  mode: ColorizeMode,
  palette: PaletteKey,
  showSilent = false,
  showConfusable = false,
  confusablePreset: ConfusablePreset = 'tout',
): string {
  if (!input.trim()) return '';
  return renderHTML(analyze(input, mode, palette, showSilent, showConfusable, confusablePreset));
}
