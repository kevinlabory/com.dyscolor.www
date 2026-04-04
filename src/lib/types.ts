export type ColorizeMode = 'syllabe' | 'mot' | 'ligne';

export type PaletteKey = 'doux' | 'classique' | 'violet';

export interface Token {
  type: 'word' | 'space' | 'newline';
  value: string;
}
