import { syllabify } from './syllabify';
import { PALETTES } from './palettes';
import { getSilentIndices, SILENT_COLOR } from './silent';
import type { ColorizeMode, PaletteKey, Token, AnalyzedPiece, AnalyzedToken, AnalyzedText } from './types';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
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
// Helpers
// ---------------------------------------------------------------------------

function splitPunctuation(word: string): [string, string, string] {
  const m = word.match(/^([^a-zA-ZÀ-ÿ0-9]*)(.*?)([^a-zA-ZÀ-ÿ0-9]*)$/u);
  if (!m) return ['', word, ''];
  return [m[1] ?? '', m[2] ?? '', m[3] ?? ''];
}

function mergeApostropheParts(word: string): string[] {
  return word.split(/(?<=[a-zA-ZÀ-ÿ]')(?=[a-zA-ZÀ-ÿ])/u);
}

// ---------------------------------------------------------------------------
// Mode: syllabe
// ---------------------------------------------------------------------------

function analyzeBySyllabe(
  tokens: Token[],
  colors: [string, string],
  showSilent: boolean,
): AnalyzedToken[] {
  let counter = 0;
  const result: AnalyzedToken[] = [];

  for (const token of tokens) {
    if (token.type !== 'word') {
      result.push({ type: token.type, raw: token.value, pieces: [] });
      continue;
    }

    const wordParts = mergeApostropheParts(token.value);
    const pieces: AnalyzedPiece[] = [];

    for (const wp of wordParts) {
      const [prefix, core, suffix] = splitPunctuation(wp);

      if (!core || /^\d+$/.test(core)) {
        // Number or empty core — single color block
        pieces.push({ text: prefix + core + suffix, color: colors[counter % 2]!, silentIndices: [] });
        counter++;
        continue;
      }

      if (prefix) {
        pieces.push({ text: prefix, color: null, silentIndices: [] });
      }

      const silentIdx = showSilent ? getSilentIndices(core) : new Set<number>();
      const syllables = syllabify(core);
      let offset = 0;

      for (let i = 0; i < syllables.length; i++) {
        const syl = syllables[i]!;
        const isLast = i === syllables.length - 1;
        const pieceText = isLast ? syl + suffix : syl;
        // Convert global-to-core silent indices to local-to-piece indices
        const localSilent = showSilent
          ? [...silentIdx]
              .filter(si => si >= offset && si < offset + syl.length)
              .map(si => si - offset)
          : [];
        pieces.push({ text: pieceText, color: colors[counter % 2]!, silentIndices: localSilent });
        offset += syl.length;
        counter++;
      }

      if (!syllables.length) {
        pieces.push({ text: suffix, color: null, silentIndices: [] });
      }
    }

    result.push({ type: 'word', raw: token.value, pieces });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Mode: mot
// ---------------------------------------------------------------------------

function analyzeByMot(
  tokens: Token[],
  colors: [string, string],
  showSilent: boolean,
): AnalyzedToken[] {
  let counter = 0;
  const result: AnalyzedToken[] = [];

  for (const token of tokens) {
    if (token.type !== 'word') {
      result.push({ type: token.type, raw: token.value, pieces: [] });
      continue;
    }

    const [prefix, core, suffix] = splitPunctuation(token.value);
    const color = colors[counter % 2]!;
    const pieces: AnalyzedPiece[] = [];

    if (!core || !showSilent) {
      pieces.push({ text: token.value, color, silentIndices: [] });
    } else {
      if (prefix) {
        pieces.push({ text: prefix, color: null, silentIndices: [] });
      }
      // silentIdx is already 0-based within core; piece starts at core (offset 0)
      const localSilent = [...getSilentIndices(core)];
      pieces.push({ text: core + suffix, color, silentIndices: localSilent });
    }
    counter++;

    result.push({ type: 'word', raw: token.value, pieces });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Mode: ligne
// ---------------------------------------------------------------------------

function analyzeByLigne(text: string, colors: [string, string]): AnalyzedToken[] {
  return text.split('\n').map((line, i) => ({
    type: 'line' as const,
    raw: line,
    pieces: [{ text: line, color: colors[i % 2]!, silentIndices: [] }],
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function analyze(
  input: string,
  mode: ColorizeMode,
  palette: PaletteKey,
  showSilent = false,
): AnalyzedText {
  const colors = PALETTES[palette];

  if (mode === 'ligne') {
    return { mode, palette, colors, silentColor: SILENT_COLOR, tokens: analyzeByLigne(input, colors) };
  }

  const tokens = tokenize(input);

  return {
    mode,
    palette,
    colors,
    silentColor: SILENT_COLOR,
    tokens: mode === 'syllabe'
      ? analyzeBySyllabe(tokens, colors, showSilent)
      : analyzeByMot(tokens, colors, showSilent),
  };
}
