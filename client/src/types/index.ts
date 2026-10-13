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

export interface QuestProgressItem {
  id: number;
  session_id: string;
  chapter_id: number;
  accuracy: number;
  unlocked: boolean;
  updated_at?: string;
}

export interface QuestProgressResponse {
  session_id: string;
  chapters: QuestProgressItem[];
}

export interface SubmitQuestRequest {
  session_id: string;
  chapter_id: number;
  accuracy: number;
}

export interface SubmitQuestResponse {
  success: boolean;
  session_id: string;
  chapter_id: number;
  accuracy: number;
  unlocked: boolean;
  next_chapter_unlocked: boolean;
  message: string;
}

export interface LeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  accuracy: number;
  max_streak: number;
  created_at: string;
}

export interface LeaderboardResponse {
  count: number;
  entries: LeaderboardEntry[];
}

export interface SubmitLeaderboardRequest {
  player_name: string;
  score: number;
  accuracy: number;
  max_streak: number;
}

export interface SubmitLeaderboardResponse {
  success: boolean;
  rank: number;
  entry: LeaderboardEntry;
  message: string;
}

