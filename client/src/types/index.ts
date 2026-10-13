// Shared TypeScript interfaces for BatakScript 3D

export interface SyllableToken {
  syllable: string;
  glyph: string;
  components: string[];
}

export interface TransliterationResult {
  original: string;
  result: string;
  tokens: SyllableToken[];
}

export interface GlyphInfo {
  type: 'ina' | 'anak';
  latin: string;
  glyph: string;
  unicode_hex: string;
  description: string;
}

export interface GlyphsResponse {
  count: number;
  glyphs: GlyphInfo[];
}

export interface ProgressRequest {
  session_id: string;
  lesson_id: number;
  accuracy: number;
}

export interface ProgressResponse {
  success: boolean;
  lesson_id: number;
  accuracy: number;
  completed: boolean;
  next_lesson_unlocked: boolean;
  message: string;
}
