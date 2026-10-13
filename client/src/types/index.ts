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

export interface Lesson {
  id: number;
  level: number;
  title: string;
  description: string;
  target_glyph: string;
  unicode_hex: string;
  latin_sound: string;
  reference_points: string;
  created_at?: string;
}

export interface LessonsResponse {
  count: number;
  lessons: Lesson[];
}

export interface UserProgressItem {
  id: number;
  session_id: string;
  lesson_id: number;
  accuracy: number;
  completed: boolean;
  updated_at?: string;
}

export interface UserProgressResponse {
  session_id: string;
  progress: UserProgressItem[];
}

