import { syllabify } from './syllabify';
import { PALETTES } from './palettes';
import { getSilentIndices, SILENT_COLOR } from './silent';
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

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(text: string, color: string): string {
  return `<span style="color:${color}">${escape(text)}</span>`;
}

function passthrough(text: string): string {
  if (text === '\n') return '<br>';
  return `<span>${escape(text)}</span>`;
}

// Strip leading/trailing punctuation from a word for syllabification,
// returning [prefix, core, suffix].
function splitPunctuation(word: string): [string, string, string] {
  const m = word.match(/^([^a-zA-ZÀ-ÿ0-9]*)(.*?)([^a-zA-ZÀ-ÿ0-9]*)$/u);
  if (!m) return ['', word, ''];
  return [m[1] ?? '', m[2] ?? '', m[3] ?? ''];
}

/**
 * Render `text` using `mainColor`, but override characters whose index
 * (relative to `coreOffset` within the full core word) is in `silentIdx`
 * with SILENT_COLOR. Adjacent runs of the same color are merged into one span.
 */
function renderWithSilent(
  text: string,
  mainColor: string,
  silentIdx: Set<number>,
  coreOffset: number
): string {
  if (silentIdx.size === 0) return span(text, mainColor);

  let result = '';
  let i = 0;
  while (i < text.length) {
    const color = silentIdx.has(coreOffset + i) ? SILENT_COLOR : mainColor;
    let run = text[i]!;
    let j = i + 1;
    while (j < text.length) {
      const c = silentIdx.has(coreOffset + j) ? SILENT_COLOR : mainColor;
      if (c !== color) break;
      run += text[j]!;
      j++;
    }
    result += span(run, color);
    i = j;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Mode: syllabe
// ---------------------------------------------------------------------------

function colorizeBySyllabe(
  tokens: Token[],
  colors: [string, string],
  showSilent: boolean
): string {
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

      const silentIdx = showSilent ? getSilentIndices(core) : new Set<number>();
      const syllables = syllabify(core);
      let offset = 0;

      for (let i = 0; i < syllables.length; i++) {
        const color = colors[counter % 2]!;
        const syllText = i === syllables.length - 1 ? syllables[i]! + suffix : syllables[i]!;
        parts.push(renderWithSilent(syllText, color, silentIdx, offset));
        offset += syllables[i]!.length;
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
  return word.split(/(?<=[a-zA-ZÀ-ÿ]')(?=[a-zA-ZÀ-ÿ])/u);
}

// ---------------------------------------------------------------------------
// Mode: mot
// ---------------------------------------------------------------------------

function colorizeByMot(
  tokens: Token[],
  colors: [string, string],
  showSilent: boolean
): string {
  let counter = 0;
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type !== 'word') {
      parts.push(passthrough(token.value));
      continue;
    }

    const [prefix, core, suffix] = splitPunctuation(token.value);
    const color = colors[counter % 2]!;

    if (!core || !showSilent) {
      parts.push(span(token.value, color));
    } else {
      if (prefix) parts.push(passthrough(prefix));
      const silentIdx = getSilentIndices(core);
      parts.push(renderWithSilent(core + suffix, color, silentIdx, 0));
    }
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
  palette: PaletteKey,
  showSilent = false
): string {
  if (!input.trim()) return '';

  const colors = PALETTES[palette];

  if (mode === 'ligne') {
    return colorizeByLigne(input, colors);
  }

  const tokens = tokenize(input);

  if (mode === 'syllabe') {
    return colorizeBySyllabe(tokens, colors, showSilent);
  }

  return colorizeByMot(tokens, colors, showSilent);
}
