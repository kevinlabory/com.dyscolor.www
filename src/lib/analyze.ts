import { syllabify } from './syllabify';
import { PALETTES } from './palettes';
import { getSilentIndices, SILENT_COLOR } from './silent';
import { getConfusableIndices, CONFUSABLE_COLOR } from './confusable';
import type { ConfusablePreset } from './confusable';
import type { ColorizeMode, PaletteKey, Token, AnalyzedPiece, AnalyzedToken, AnalyzedText } from './types';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

// Normalize typographic apostrophes to ASCII (common when copy-pasting from websites)
function normalize(text: string): string {
  return text.replace(/[‘’‚‛ʼʻ]/g, "'");
}

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

// Split at apostrophes and hyphens between letters (elision + compound words)
function splitAtConnectors(word: string): string[] {
  return word.split(/(?<=[a-zA-ZÀ-ÿ][-'])(?=[a-zA-ZÀ-ÿ])/u);
}

// ---------------------------------------------------------------------------
// Mode: syllabe
// ---------------------------------------------------------------------------

function analyzeBySyllabe(
  tokens: Token[],
  colors: [string, string],
  showSilent: boolean,
  showConfusable: boolean,
  confusablePreset: ConfusablePreset,
): AnalyzedToken[] {
  let counter = 0;
  const result: AnalyzedToken[] = [];

  for (const token of tokens) {
    if (token.type !== 'word') {
      result.push({ type: token.type, raw: token.value, pieces: [] });
      continue;
    }

    const wordParts = splitAtConnectors(token.value);
    const pieces: AnalyzedPiece[] = [];

    for (const wp of wordParts) {
      const [prefix, core, suffix] = splitPunctuation(wp);

      if (!core || /^\d+$/.test(core)) {
        // Number or empty core — single color block
        pieces.push({ text: prefix + core + suffix, color: colors[counter % 2]!, silentIndices: [], confusableIndices: [] });
        counter++;
        continue;
      }

      if (prefix) {
        pieces.push({ text: prefix, color: null, silentIndices: [], confusableIndices: [] });
      }

      const silentIdx = showSilent ? getSilentIndices(core) : new Set<number>();
      const confusableIdx = showConfusable ? getConfusableIndices(core, confusablePreset) : new Set<number>();
      const syllables = syllabify(core);
      let offset = 0;

      for (let i = 0; i < syllables.length; i++) {
        const syl = syllables[i]!;
        const isLast = i === syllables.length - 1;
        const pieceText = isLast ? syl + suffix : syl;
        const localSilent = showSilent
          ? [...silentIdx]
              .filter(si => si >= offset && si < offset + syl.length)
              .map(si => si - offset)
          : [];
        const localConfusable = showConfusable
          ? [...confusableIdx]
              .filter(ci => ci >= offset && ci < offset + syl.length)
              .map(ci => ci - offset)
          : [];
        pieces.push({ text: pieceText, color: colors[counter % 2]!, silentIndices: localSilent, confusableIndices: localConfusable });
        offset += syl.length;
        counter++;
      }

      if (!syllables.length) {
        pieces.push({ text: suffix, color: null, silentIndices: [], confusableIndices: [] });
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
  showConfusable: boolean,
  confusablePreset: ConfusablePreset,
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

    const needsSplit = (showSilent || showConfusable) && core;
    if (!needsSplit) {
      pieces.push({ text: token.value, color, silentIndices: [], confusableIndices: [] });
    } else {
      if (prefix) {
        pieces.push({ text: prefix, color: null, silentIndices: [], confusableIndices: [] });
      }
      const localSilent = showSilent ? [...getSilentIndices(core)] : [];
      const localConfusable = showConfusable ? [...getConfusableIndices(core, confusablePreset)] : [];
      pieces.push({ text: core + suffix, color, silentIndices: localSilent, confusableIndices: localConfusable });
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
    pieces: [{ text: line, color: colors[i % 2]!, silentIndices: [], confusableIndices: [] }],
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
  showConfusable = false,
  confusablePreset: ConfusablePreset = 'tout',
): AnalyzedText {
  const colors = PALETTES[palette];

  const text = normalize(input);

  if (mode === 'ligne') {
    return { mode, palette, colors, silentColor: SILENT_COLOR, confusableColor: CONFUSABLE_COLOR, tokens: analyzeByLigne(text, colors) };
  }

  const tokens = tokenize(text);

  return {
    mode,
    palette,
    colors,
    silentColor: SILENT_COLOR,
    confusableColor: CONFUSABLE_COLOR,
    tokens: mode === 'syllabe'
      ? analyzeBySyllabe(tokens, colors, showSilent, showConfusable, confusablePreset)
      : analyzeByMot(tokens, colors, showSilent, showConfusable, confusablePreset),
  };
}
