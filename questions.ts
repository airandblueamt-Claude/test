'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeAudioToMono16k } from '../lib/audio';
import { markQuestions } from '../lib/questions';
import type { Segment, TranscriberStatus, TranscriptDoc } from '../lib/types';

interface ModelProgress {
  file?: string;
  status?: string;
  progress?: number;
}

export function useTranscriber() {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<TranscriberStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [decodeRatio, setDecodeRatio] = useState(0);
  const [modelProgress, setModelProgress] = useState<ModelProgress[]>([]);
  const [partial, setPartial] = useState('');
  const [result, setResult] = useState<TranscriptDoc | null>(null);

  const pendingMeta = useRef<{ fileName: string; durationSec: number; model: string; language: string } | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/transcriber.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'status') setStatus(payload);
      else if (type === 'model-progress') {
        setStatus('loading-model');
        setModelProgress((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.file === payload.file);
          const entry = {
            file: payload.file,
            status: payload.status,
            progress: payload.progress,
          };
          if (idx >= 0) next[idx] = entry;
          else next.push(entry);
          return next;
        });
      } else if (type === 'partial') {
        setPartial(payload);
      } else if (type === 'result') {
        const meta = pendingMeta.current!;
        const chunks: { text: string; timestamp: [number, number] }[] =
          payload.chunks ?? [];
        const segments: Segment[] = (chunks.length
          ? chunks
          : [{ text: payload.text ?? '', timestamp: [0, meta.durationSec] }]
        )
          .filter((c) => c.text && c.text.trim())
          .map((c, i) => ({
            id: `seg-${i}`,
            start: c.timestamp?.[0] ?? 0,
            end: c.timestamp?.[1] ?? c.timestamp?.[0] ?? 0,
            text: c.text.trim(),
            tags: [],
            isQuestion: false,
          }));

        const doc: TranscriptDoc = {
          fileName: meta.fileName,
          createdAt: new Date().toISOString(),
          durationSec: meta.durationSec,
          model: meta.model,
          language: meta.language,
          segments: markQuestions(segments),
        };
        setResult(doc);
        setStatus('done');
        setPartial('');
      } else if (type === 'error') {
        setError(payload);
        setStatus('error');
      }
    };

    return () => worker.terminate();
  }, []);

  const transcribe = useCallback(
    async (file: File, model: string, language: string) => {
      setError(null);
      setResult(null);
      setPartial('');
      setModelProgress([]);
      setDecodeRatio(0);
      setStatus('decoding');
      try {
        const { audio, durationSec } = await decodeAudioToMono16k(
          file,
          setDecodeRatio,
        );
        pendingMeta.current = {
          fileName: file.name,
          durationSec,
          model,
          language,
        };
        workerRef.current?.postMessage({ audio, model, language }, [audio.buffer]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Could not decode this audio file.',
        );
        setStatus('error');
      }
    },
    [],
  );

  return {
    status,
    error,
    decodeRatio,
    modelProgress,
    partial,
    result,
    transcribe,
    reset: () => {
      setStatus('idle');
      setResult(null);
      setError(null);
      setPartial('');
    },
  };
}
