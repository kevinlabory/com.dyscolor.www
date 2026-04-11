import { analyze } from './analyze';
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
function renderPiece(piece: AnalyzedPiece, silentColor: string): string {
  const { text, color, silentIndices } = piece;

  if (color === null) {
    return `<span>${escape(text)}</span>`;
  }

  if (silentIndices.length === 0) {
    return `<span style="color:${color}">${escape(text)}</span>`;
  }

  // Merge adjacent characters that share the same color into one span.
  const silentSet = new Set(silentIndices);
  let result = '';
  let i = 0;
  while (i < text.length) {
    const runColor = silentSet.has(i) ? silentColor : color;
    let run = text[i]!;
    let j = i + 1;
    while (j < text.length) {
      if ((silentSet.has(j) ? silentColor : color) !== runColor) break;
      run += text[j]!;
      j++;
    }
    result += `<span style="color:${runColor}">${escape(run)}</span>`;
    i = j;
  }
  return result;
}

function renderHTML(analyzed: AnalyzedText): string {
  const { tokens, silentColor } = analyzed;
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
      parts.push(renderPiece(piece, silentColor));
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
): string {
  if (!input.trim()) return '';
  return renderHTML(analyze(input, mode, palette, showSilent));
}
