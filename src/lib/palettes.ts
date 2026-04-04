import type { PaletteKey } from './types';

export const PALETTES: Record<PaletteKey, [string, string]> = {
  doux:      ['#0e7490', '#92400e'],
  classique: ['#1a56db', '#d03801'],
  violet:    ['#5b21b6', '#0f766e'],
};

export const PALETTE_LABELS: Record<PaletteKey, string> = {
  doux:      'Doux',
  classique: 'Classique',
  violet:    'Violet',
};
