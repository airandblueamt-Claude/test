'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioWaveform, FileText, HelpCircle, Loader2, RotateCcw } from 'lucide-react';
import AudioUploader, { type UploadConfig } from './components/AudioUploader';
import AudioPlayer from './components/AudioPlayer';
import TranscriptViewer from './components/TranscriptViewer';
import QuestionsPanel from './components/QuestionsPanel';
import ReportPanel from './components/ReportPanel';
import { useTranscriber } from './hooks/useTranscriber';
import { buildQnA, markQuestions } from './lib/questions';
import { buildReport } from './lib/report';
import { clearTranscript, loadTranscript, saveTranscript } from './lib/storage';
import type { Segment, TagKind, TranscriptDoc } from './lib/types';

type Tab = 'transcript' | 'questions' | 'report';

export default function Home() {
  const { status, error, decodeRatio, modelProgress, partial, result, transcribe, reset } =
    useTranscriber();

  const [doc, setDoc] = useState<TranscriptDoc | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('transcript');
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Restore the last transcript on load (annotations included).
  useEffect(() => {
    const saved = loadTranscript();
    if (saved) setDoc({ ...saved, segments: markQuestions(saved.segments) });
  }, []);

  // When transcription finishes, adopt the result.
  useEffect(() => {
    if (result) {
      setDoc(result);
      const r = saveTranscript(result);
      if (!r.ok) setStorageNote(r.error ?? null);
      setTab('transcript');
    }
  }, [result]);

  const handleFile = (file: File, config: UploadConfig) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setStorageNote(null);
    transcribe(file, config.model, config.language);
  };

  const toggleTag = (segmentId: string, tag: TagKind) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const segments: Segment[] = prev.segments.map((s) =>
        s.id === segmentId
          ? {
              ...s,
              tags: s.tags.includes(tag)
                ? s.tags.filter((t) => t !== tag)
                : [...s.tags, tag],
            }
          : s,
      );
      const next = { ...prev, segments };
      const r = saveTranscript(next);
      if (!r.ok) setStorageNote(r.error ?? null);
      return next;
    });
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      audioRef.current.play().catch(() => {});
    }
  };

  const startOver = () => {
    if (!confirm('Clear the current transcript and annotations?')) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDoc(null);
    clearTranscript();
    reset();
  };

  const qna = useMemo(() => (doc ? buildQnA(doc.segments) : []), [doc]);
  const report = useMemo(() => (doc ? buildReport(doc) : null), [doc]);
  const busy = ['decoding', 'loading-model', 'transcribing'].includes(status);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 sm:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <AudioWaveform size={14} /> Local · No API keys · Offline-ready
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Meeting Transcript Organizer
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Transcribe a recording in your browser, surface questions and
            answers, mark notes, requirements, decisions and action items, then
            export a Word report.
          </p>
        </div>
        {doc && (
          <button
            onClick={startOver}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm hover:bg-ink/[0.03]"
          >
            <RotateCcw size={14} /> Start over
          </button>
        )}
      </header>

      {/* Upload + progress */}
      {!doc && (
        <div className="mx-auto max-w-2xl">
          <AudioUploader onFile={handleFile} disabled={busy} />
          {busy && <ProgressView status={status} decodeRatio={decodeRatio} modelProgress={modelProgress} partial={partial} />}
          {status === 'error' && (
            <p className="mt-4 rounded-lg border border-tag-question/30 bg-rose-50 px-4 py-3 text-sm text-tag-question">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Workspace */}
      {doc && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Left: audio + transcript */}
          <div className="flex flex-col gap-4">
            {audioUrl ? (
              <AudioPlayer ref={audioRef} src={audioUrl} fileName={doc.fileName} />
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-white/50 p-3 text-xs text-muted">
                Audio isn’t stored between sessions. Re-upload “{doc.fileName}” to
                listen and jump to timestamps.
              </div>
            )}
            <div className="flex min-h-[24rem] flex-1 flex-col rounded-2xl border border-line bg-paper p-4">
              <TranscriptViewer
                segments={doc.segments}
                onToggleTag={toggleTag}
                onSeek={seek}
              />
            </div>
          </div>

          {/* Right: tabs */}
          <div className="flex flex-col rounded-2xl border border-line bg-white">
            <div className="flex border-b border-line">
              {(
                [
                  ['questions', 'Questions & Answers', HelpCircle],
                  ['report', 'Report', FileText],
                ] as [Tab, string, typeof FileText][]
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'border-b-2 border-ink text-ink'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            <div className="min-h-[28rem] flex-1 p-4">
              {tab === 'report' && report ? (
                <ReportPanel report={report} />
              ) : (
                <QuestionsPanel qna={qna} onSeek={seek} />
              )}
            </div>
          </div>
        </div>
      )}

      {storageNote && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {storageNote}
        </p>
      )}

      <footer className="mt-10 border-t border-line pt-5 text-center font-mono text-[11px] text-muted">
        Runs locally with Whisper via Transformers.js · annotations saved in your
        browser · no audio leaves your device.
      </footer>
    </main>
  );
}

function ProgressView({
  status,
  decodeRatio,
  modelProgress,
  partial,
}: {
  status: string;
  decodeRatio: number;
  modelProgress: { file?: string; progress?: number; status?: string }[];
  partial: string;
}) {
  const label =
    status === 'decoding'
      ? 'Decoding audio…'
      : status === 'loading-model'
        ? 'Downloading the model (first run only — cached afterwards)…'
        : 'Transcribing…';

  const downloads = modelProgress.filter((p) => p.status === 'progress');

  return (
    <div className="mt-6 rounded-xl border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 size={16} className="animate-spin" />
        {label}
      </div>

      {status === 'decoding' && (
        <Bar value={decodeRatio} />
      )}

      {downloads.length > 0 && (
        <div className="mt-3 space-y-2">
          {downloads.map((d) => (
            <div key={d.file}>
              <div className="mb-1 truncate font-mono text-[11px] text-muted">
                {d.file}
              </div>
              <Bar value={(d.progress ?? 0) / 100} />
            </div>
          ))}
        </div>
      )}

      {status === 'transcribing' && partial && (
        <p className="mt-3 max-h-24 overflow-hidden text-sm italic text-muted">
          …{partial}
        </p>
      )}
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-ink transition-all"
        style={{ width: `${Math.min(100, Math.max(3, value * 100))}%` }}
      />
    </div>
  );
}
