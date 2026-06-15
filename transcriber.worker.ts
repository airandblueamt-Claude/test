import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { formatTime } from './audio';
import type { ReportModel } from './report';
import { TAG_META } from './types';

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true })],
  });
}

function subtle(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, italics: true, color: '6B6862', size: 20 })],
  });
}

function bullet(text: string, color?: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, color })],
  });
}

function empty(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, italics: true, color: '9A968E' })],
  });
}

export async function exportDocx(report: ReportModel): Promise<Blob> {
  const dateStr = new Date(report.date).toLocaleString();
  const children: Paragraph[] = [];

  // Title block
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'Meeting Report', bold: true, size: 48 }),
      ],
    }),
    subtle(`File: ${report.fileName}`),
    subtle(`Date: ${dateStr}`),
    subtle(
      `Duration: ${formatTime(report.durationSec)}  ·  Model: ${report.model}  ·  Language: ${report.language}`,
    ),
  );

  // Questions
  children.push(heading('Questions'));
  if (report.qna.length === 0) children.push(empty('No questions detected.'));
  report.qna.forEach((q, i) =>
    children.push(bullet(`Q${i + 1} [${formatTime(q.questionStart)}] ${q.question}`)),
  );

  // Answers
  children.push(heading('Answers'));
  if (report.qna.length === 0) children.push(empty('No answers detected.'));
  report.qna.forEach((q, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 20 },
        children: [new TextRun({ text: `Q${i + 1}: ${q.question}`, bold: true })],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `Possible answer: ${q.answer || '(no response captured)'}`,
          }),
        ],
      }),
    );
  });

  // Tagged sections
  const taggedSections: [string, typeof report.notes, string][] = [
    ['Notes', report.notes, TAG_META.note.color.replace('#', '')],
    ['Requirements', report.requirements, TAG_META.requirement.color.replace('#', '')],
    ['Decisions', report.decisions, TAG_META.decision.color.replace('#', '')],
    ['Action Items', report.actions, TAG_META.action.color.replace('#', '')],
  ];
  for (const [title, items, color] of taggedSections) {
    children.push(heading(title));
    if (items.length === 0) children.push(empty(`No ${title.toLowerCase()} marked.`));
    items.forEach((s) =>
      children.push(bullet(`[${formatTime(s.start)}] ${s.text.trim()}`, color)),
    );
  }

  // Full transcript
  children.push(heading('Full Transcript'));
  report.segments.forEach((s) => {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `[${formatTime(s.start)}] `, bold: true, color: '6B6862' }),
          ...(s.speaker
            ? [new TextRun({ text: `${s.speaker}: `, bold: true })]
            : []),
          new TextRun({ text: s.text.trim() }),
        ],
      }),
    );
  });

  const doc = new Document({
    creator: 'Meeting Transcript Organizer',
    title: `Meeting Report — ${report.fileName}`,
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
