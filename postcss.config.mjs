/* eslint-disable @typescript-eslint/no-explicit-any */
// Whisper speech-to-text running entirely in the browser via Transformers.js.
// The model is downloaded once from the Hugging Face CDN and then cached by the
// browser, so subsequent runs work offline. No API keys, no server.

import { pipeline, env } from '@xenova/transformers';

// Use the bundled WASM backend; allow remote model download + browser caching.
env.allowLocalModels = false;
env.useBrowserCache = true;

type Task = 'automatic-speech-recognition';

let transcriber: any = null;
let loadedModel: string | null = null;

async function getTranscriber(model: string, post: (m: any) => void) {
  if (transcriber && loadedModel === model) return transcriber;
  transcriber = await pipeline('automatic-speech-recognition' as Task, model, {
    progress_callback: (p: any) => {
      // p: { status, file, progress, loaded, total }
      post({ type: 'model-progress', payload: p });
    },
  });
  loadedModel = model;
  return transcriber;
}

self.onmessage = async (e: MessageEvent) => {
  const { audio, model, language } = e.data as {
    audio: Float32Array;
    model: string;
    language: string;
  };

  try {
    self.postMessage({ type: 'status', payload: 'loading-model' });
    const asr = await getTranscriber(model, (m) => self.postMessage(m));

    self.postMessage({ type: 'status', payload: 'transcribing' });

    const isEnglishOnly = model.endsWith('.en');
    const output = await asr(audio, {
      // 30s windows with overlap keep long meetings accurate and bounded.
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      ...(isEnglishOnly
        ? {}
        : { language: language === 'auto' ? undefined : language, task: 'transcribe' }),
      callback_function: (items: any[]) => {
        // Streaming partial decode of the current chunk.
        const partial = items?.[0]?.text ?? '';
        self.postMessage({ type: 'partial', payload: partial });
      },
    });

    self.postMessage({ type: 'result', payload: output });
  } catch (err: any) {
    self.postMessage({
      type: 'error',
      payload: err?.message ?? 'Transcription failed.',
    });
  }
};
