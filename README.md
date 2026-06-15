import type { QnA, Segment } from './types';

// Words that, when they START a sentence, strongly suggest a question even
// without a question mark (Whisper often drops punctuation).
const LEADING_QUESTION_WORDS = [
  'how',
  'what',
  'why',
  'when',
  'where',
  'which',
  'who',
  'whom',
  'whose',
  'can',
  'could',
  'would',
  'should',
  'do',
  'does',
  'did',
  'is',
  'are',
  'was',
  'were',
  'will',
  'shall',
  'may',
  'might',
];

/** Split a chunk of text into rough sentences. */
function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Heuristic: does this single sentence read like a question? */
export function looksLikeQuestion(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed) return false;
  if (trimmed.endsWith('?')) return true;

  const firstWord = trimmed
    .toLowerCase()
    .replace(/^[^a-z]+/, '')
    .split(/\s+/)[0];
  return LEADING_QUESTION_WORDS.includes(firstWord);
}

/** Flag whole segments that contain at least one question sentence. */
export function markQuestions(segments: Segment[]): Segment[] {
  return segments.map((seg) => ({
    ...seg,
    isQuestion: splitSentences(seg.text).some(looksLikeQuestion),
  }));
}

/**
 * Build Question → Possible Answer pairs.
 * For each question segment, the answer is every following segment up to (but
 * not including) the next question segment. Purely heuristic, no AI.
 */
export function buildQnA(segments: Segment[]): QnA[] {
  const pairs: QnA[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (!segments[i].isQuestion) continue;

    const answerSegments: Segment[] = [];
    for (let j = i + 1; j < segments.length; j++) {
      if (segments[j].isQuestion) break;
      answerSegments.push(segments[j]);
    }

    pairs.push({
      questionId: segments[i].id,
      question: segments[i].text.trim(),
      questionStart: segments[i].start,
      answerSegmentIds: answerSegments.map((s) => s.id),
      answer: answerSegments.map((s) => s.text.trim()).join(' ').trim(),
    });
  }
  return pairs;
}
