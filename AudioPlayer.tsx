'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { formatTime } from '../lib/audio';
import { downloadBlob, exportDocx } from '../lib/docx';
import type { ReportModel } from '../lib/report';
import { TAG_META, type Segment } from '../lib/types';

function Section({
  title,
  count,
  color,
  children,
}: {
  title: string;
  count: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
        {color && (
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        )}
        {title}
        <span className="font-mono text-xs font-normal text-muted">({count})</span>
      </h3>
      {children}
    </section>
  );
}

function TagList({ items, color }: { items: Segment[]; color: string }) {
  if (items.length === 0)
    return <p className="text-sm italic text-muted">None marked.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((s) => (
        <li key={s.id} className="flex gap-2 text-sm">
          <span className="shrink-0 font-mono text-xs text-muted">
            {formatTime(s.start)}
          </span>
          <span style={{ borderLeft: `2px solid ${color}` }} className="pl-2">
            {s.text.trim()}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportPanel({ report }: { report: ReportModel }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportDocx(report);
      const safe = report.fileName.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_');
      downloadBlob(blob, `Meeting_Report_${safe || 'transcript'}.docx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="scroll-quiet overflow-y-auto pr-1">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted">{report.fileName}</p>
          <p className="font-mono text-xs text-muted">
            {new Date(report.date).toLocaleString()} · {formatTime(report.durationSec)}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink/90 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileDown size={16} />
          )}
          Export Word (.docx)
        </button>
      </div>

      <Section title="Questions" count={report.qna.length} color="#E11D48">
        {report.qna.length === 0 ? (
          <p className="text-sm italic text-muted">No questions detected.</p>
        ) : (
          <ul className="space-y-1.5">
            {report.qna.map((q, i) => (
              <li key={q.questionId} className="flex gap-2 text-sm">
                <span className="shrink-0 font-mono text-xs text-muted">
                  Q{i + 1}
                </span>
                <span>{q.question}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Answers" count={report.qna.length} color="#E11D48">
        {report.qna.length === 0 ? (
          <p className="text-sm italic text-muted">No answers detected.</p>
        ) : (
          <ul className="space-y-3">
            {report.qna.map((q, i) => (
              <li key={q.questionId} className="text-sm">
                <p className="font-medium">Q{i + 1}: {q.question}</p>
                <p className="mt-0.5 text-ink/80">
                  {q.answer || (
                    <span className="italic text-muted">No response captured.</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Notes" count={report.notes.length} color={TAG_META.note.color}>
        <TagList items={report.notes} color={TAG_META.note.color} />
      </Section>
      <Section
        title="Requirements"
        count={report.requirements.length}
        color={TAG_META.requirement.color}
      >
        <TagList items={report.requirements} color={TAG_META.requirement.color} />
      </Section>
      <Section
        title="Decisions"
        count={report.decisions.length}
        color={TAG_META.decision.color}
      >
        <TagList items={report.decisions} color={TAG_META.decision.color} />
      </Section>
      <Section
        title="Action Items"
        count={report.actions.length}
        color={TAG_META.action.color}
      >
        <TagList items={report.actions} color={TAG_META.action.color} />
      </Section>

      <Section title="Full Transcript" count={report.segments.length}>
        <div className="space-y-1.5">
          {report.segments.map((s) => (
            <p key={s.id} className="text-sm leading-relaxed">
              <span className="mr-2 font-mono text-xs text-muted">
                {formatTime(s.start)}
              </span>
              {s.speaker && <span className="font-semibold">{s.speaker}: </span>}
              {s.text.trim()}
            </p>
          ))}
        </div>
      </Section>
    </div>
  );
}
