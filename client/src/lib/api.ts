import {
  GlyphsResponse,
  ProgressRequest,
  ProgressResponse,
  TransliterationResult,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** GET /api/v1/health */
  health: () => request<{ status: string; service: string }>('/health'),

  /** GET /api/v1/glyphs */
  glyphs: () => request<GlyphsResponse>('/glyphs'),

  /** POST /api/v1/transliterate */
  transliterate: (text: string) =>
    request<TransliterationResult>('/transliterate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  /** POST /api/v1/progress */
  submitProgress: (data: ProgressRequest) =>
    request<ProgressResponse>('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** GET /api/v1/lessons */
  lessons: () =>
    request<import('@/types').LessonsResponse>('/lessons'),

  /** GET /api/v1/progress/:session_id */
  getUserProgress: (sessionId: string) =>
    request<import('@/types').UserProgressResponse>(`/progress/${sessionId}`),
};

