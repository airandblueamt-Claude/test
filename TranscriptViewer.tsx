'use client';

import { HelpCircle } from 'lucide-react';
import { formatTime } from '../lib/audio';
import type { QnA } from '../lib/types';

export default function QuestionsPanel({
  qna,
  onSeek,
}: {
  qna: QnA[];
  onSeek: (s: number) => void;
}) {
  if (qna.length === 0) {
    return (
      <p className="py-10 text-center text-sm italic text-muted">
        No questions detected yet. Questions are flagged by simple rules — a
        sentence ending in “?” or opening with words like How, What, Why, Can,
        or Would.
      </p>
    );
  }

  return (
    <div className="scroll-quiet space-y-4 overflow-y-auto pr-1">
      <p className="font-mono text-xs text-muted">
        {qna.length} question{qna.length === 1 ? '' : 's'} detected · answers are
        grouped from the lines that follow each question.
      </p>
      {qna.map((q, i) => (
        <div key={q.questionId} className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-start gap-2">
            <HelpCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#E11D48' }} />
            <div className="flex-1">
              <button
                onClick={() => onSeek(q.questionStart)}
                className="mb-0.5 font-mono text-[11px] text-muted hover:text-ink"
              >
                Q{i + 1} · {formatTime(q.questionStart)}
              </button>
              <p className="font-medium leading-snug">{q.question}</p>
            </div>
          </div>
          <div className="mt-3 border-l-2 pl-3" style={{ borderColor: '#E7E3DB' }}>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">
              Possible answer
            </p>
            <p className="text-sm leading-relaxed text-ink/90">
              {q.answer || (
                <span className="italic text-muted">No response captured.</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
