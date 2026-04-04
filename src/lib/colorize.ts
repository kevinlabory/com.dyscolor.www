import { syllabify } from './syllabify';
import { PALETTES } from './palettes';
import type { ColorizeMode, PaletteKey, Token } from './types';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // Match runs of non-whitespace, single newlines, or runs of spaces/tabs
  const re = /\n|[^\S\n]+|[^\s]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const val = match[0];
    if (val === '\n') {
      tokens.push({ type: 'newline', value: val });
    } else if (/^\s+$/.test(val)) {
      tokens.push({ type: 'space', value: val });
    } else {
      tokens.push({ type: 'word', value: val });
    }
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Span helpers
// ---------------------------------------------------------------------------

function span(text: string, color: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<span style="color:${color}">${escaped}</span>`;
}

function passthrough(text: string): string {
  if (text === '\n') return '<br>';
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<span>${escaped}</span>`;
}

// Strip leading/trailing punctuation from a word for syllabification,
// returning [prefix, core, suffix].
function splitPunctuation(word: string): [string, string, string] {
  const leadMatch = word.match(/^([^a-zA-ZÀ-ÿ0-9]*)(.*?)([^a-zA-ZÀ-ÿ0-9]*)$/u);
  if (!leadMatch) return ['', word, ''];
  return [leadMatch[1] ?? '', leadMatch[2] ?? '', leadMatch[3] ?? ''];
}

// ---------------------------------------------------------------------------
// Mode: syllabe
// ---------------------------------------------------------------------------

function colorizeBySyllabe(tokens: Token[], colors: [string, string]): string {
  let counter = 0;
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type !== 'word') {
      parts.push(passthrough(token.value));
      continue;
    }

    // Handle apostrophes: split "l'école" → ["l'", "école"]
    const wordParts = mergeApostropheParts(token.value);

    for (const wp of wordParts) {
      const [prefix, core, suffix] = splitPunctuation(wp);
      if (!core || /^\d+$/.test(core)) {
        // Number or empty core — treat as single color block
        const color = colors[counter % 2]!;
        parts.push(span(prefix + core + suffix, color));
        counter++;
        continue;
      }
      if (prefix) parts.push(passthrough(prefix));
      const syllables = syllabify(core);
      for (let i = 0; i < syllables.length; i++) {
        const color = colors[counter % 2]!;
        const syllText = i === syllables.length - 1 ? syllables[i]! + suffix : syllables[i]!;
        parts.push(span(syllText, color));
        counter++;
      }
      if (!syllables.length) parts.push(passthrough(suffix));
    }
  }

  return parts.join('');
}

/**
 * Split a raw word token on internal apostrophes, keeping the apostrophe
 * attached to the left part.
 * "l'école" → ["l'", "école"], "aujourd'hui" → ["aujourd'", "hui"]
 */
function mergeApostropheParts(word: string): string[] {
  // Lookbehind keeps the apostrophe on the left segment.
  return word.split(/(?<=[a-zA-ZÀ-ÿ]')(?=[a-zA-ZÀ-ÿ])/u);
}

// ---------------------------------------------------------------------------
// Mode: mot
// ---------------------------------------------------------------------------

function colorizeByMot(tokens: Token[], colors: [string, string]): string {
  let counter = 0;
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type !== 'word') {
      parts.push(passthrough(token.value));
      continue;
    }
    const color = colors[counter % 2]!;
    parts.push(span(token.value, color));
    counter++;
  }

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Mode: ligne
// ---------------------------------------------------------------------------

function colorizeByLigne(text: string, colors: [string, string]): string {
  const lines = text.split('\n');
  return lines
    .map((line, i) => {
      const color = colors[i % 2]!;
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div style="color:${color}">${escaped || '&nbsp;'}</div>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function colorizeText(
  input: string,
  mode: ColorizeMode,
  palette: PaletteKey
): string {
  if (!input.trim()) return '';

  const colors = PALETTES[palette];

  if (mode === 'ligne') {
    return colorizeByLigne(input, colors);
  }

  const tokens = tokenize(input);

  if (mode === 'syllabe') {
    return colorizeBySyllabe(tokens, colors);
  }

  return colorizeByMot(tokens, colors);
}
