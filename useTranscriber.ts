'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileAudio, Cpu } from 'lucide-react';

export interface UploadConfig {
  model: string;
  language: string;
}

const MODELS = [
  { id: 'Xenova/whisper-tiny.en', label: 'Tiny · English (fastest, ~75 MB)' },
  { id: 'Xenova/whisper-base.en', label: 'Base · English (balanced, ~145 MB)' },
  { id: 'Xenova/whisper-tiny', label: 'Tiny · Multilingual (~75 MB)' },
  { id: 'Xenova/whisper-base', label: 'Base · Multilingual (~145 MB)' },
  { id: 'Xenova/whisper-small', label: 'Small · Multilingual (best, ~485 MB)' },
];

const LANGUAGES = [
  { id: 'auto', label: 'Auto-detect' },
  { id: 'english', label: 'English' },
  { id: 'arabic', label: 'Arabic' },
  { id: 'french', label: 'French' },
  { id: 'spanish', label: 'Spanish' },
  { id: 'german', label: 'German' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'chinese', label: 'Chinese' },
];

export default function AudioUploader({
  onFile,
  disabled,
}: {
  onFile: (file: File, config: UploadConfig) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [language, setLanguage] = useState('auto');

  const isEnglishOnly = model.endsWith('.en');

  const handle = useCallback(
    (file?: File | null) => {
      if (!file) return;
      onFile(file, { model, language: isEnglishOnly ? 'english' : language });
    },
    [onFile, model, language, isEnglishOnly],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted">
            <Cpu size={13} /> Transcription model
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={disabled}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none disabled:opacity-50"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted">
            Language
          </span>
          <select
            value={isEnglishOnly ? 'english' : language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={disabled || isEnglishOnly}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-ink focus:outline-none disabled:opacity-50"
          >
            {(isEnglishOnly ? LANGUAGES.filter((l) => l.id === 'english') : LANGUAGES).map(
              (l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled)
            inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging
            ? 'border-tag-action bg-amber-50/60'
            : 'border-line hover:border-muted'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <div className="mb-3 rounded-full bg-ink/5 p-3">
          {dragging ? (
            <FileAudio className="text-tag-action" size={28} />
          ) : (
            <UploadCloud className="text-ink" size={28} />
          )}
        </div>
        <p className="text-base font-medium">
          Drop a recording here, or click to browse
        </p>
        <p className="mt-1 font-mono text-xs text-muted">
          MP3, M4A, WAV, OGG · large files supported · processed on your device
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
