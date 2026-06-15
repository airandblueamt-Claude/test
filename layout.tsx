import type { TranscriptDoc } from './types';

const KEY = 'mto:transcript:v1';

// Only the transcript + annotations are stored (never the audio itself, which
// is far too large for localStorage). Re-upload the audio to listen again.
export function saveTranscript(doc: TranscriptDoc): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc));
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error && e.name === 'QuotaExceededError'
          ? 'This transcript is too large for browser storage; your work stays in this tab but will not persist on refresh.'
          : 'Could not save to browser storage.',
    };
  }
}

export function loadTranscript(): TranscriptDoc | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TranscriptDoc) : null;
  } catch {
    return null;
  }
}

export function clearTranscript(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
