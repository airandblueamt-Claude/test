'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, HelpCircle, Search } from 'lucide-react';
import { formatTime } from '../lib/audio';
import { TAG_META, TAG_ORDER, type Segment, type TagKind } from '../lib/types';

interface Props {
  segments: Segment[];
  onToggleTag: (segmentId: string, tag: TagKind) => void;
  onSeek: (seconds: number) => void;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function TranscriptViewer({ segments, onToggleTag, onSeek }: Props) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return segments;
    const q = query.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, query]);

  const copyAll = async () => {
    const text = segments
      .map((s) => `[${formatTime(s.start)}] ${s.speaker ? s.speaker + ': ' : ''}${s.text}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the transcript"
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm focus:border-ink focus:outline-none"
          />
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-ink/[0.03]"
        >
          {copied ? <Check size={15} className="text-tag-decision" /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="scroll-quiet -mr-2 flex-1 space-y-4 overflow-y-auto pr-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm italic text-muted">
            No transcript lines match “{query}”.
          </p>
        )}
        {filtered.map((seg) => (
          <SegmentBlock
            key={seg.id}
            seg={seg}
            query={query}
            onToggleTag={onToggleTag}
            onSeek={onSeek}
          />
        ))}
      </div>
    </div>
  );
}

function SegmentBlock({
  seg,
  query,
  onToggleTag,
  onSeek,
}: {
  seg: Segment;
  query: string;
  onToggleTag: (id: string, tag: TagKind) => void;
  onSeek: (s: number) => void;
}) {
  return (
    <div className="group rounded-lg border border-transparent p-2 transition-colors hover:border-line hover:bg-white">
      <div className="flex items-baseline gap-2">
        <button
          onClick={() => onSeek(seg.start)}
          title="Jump to this moment"
          className="shrink-0 font-mono text-xs text-muted hover:text-ink"
        >
          {formatTime(seg.start)}
        </button>
        {seg.speaker && (
          <span className="font-mono text-xs font-semibold text-ink">{seg.speaker}</span>
        )}
        {seg.isQuestion && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium"
            style={{ color: TAG_META.note.color, background: 'transparent' }}
          >
            <HelpCircle size={11} style={{ color: '#E11D48' }} />
            <span style={{ color: '#E11D48' }}>question</span>
          </span>
        )}
      </div>

      <p className={`mt-0.5 leading-relaxed ${seg.isQuestion ? 'mark-question' : ''}`}>
        {highlight(seg.text, query)}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {TAG_ORDER.map((tag) => {
          const active = seg.tags.includes(tag);
          const meta = TAG_META[tag];
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(seg.id, tag)}
              className="rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all"
              style={
                active
                  ? { background: meta.color, borderColor: meta.color, color: 'white' }
                  : { borderColor: '#E7E3DB', color: meta.color }
              }
            >
              {active ? `✓ ${meta.short}` : `Mark as ${meta.short}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
