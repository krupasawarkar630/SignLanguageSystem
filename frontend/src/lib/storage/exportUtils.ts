import { Session, TranscriptEntry } from "./historyStore";

export function exportToTXT(session: Session, entries: TranscriptEntry[]): string {
  let txt = `SESSION: ${session.title}\n`;
  txt += `Date: ${new Date(session.startTime).toLocaleString()}\n`;
  txt += `Duration: ${session.durationMs ? Math.round(session.durationMs / 1000) : 0} seconds\n`;
  txt += `--------------------------------------------------\n\n`;

  let sentenceBuffer: string[] = [];
  
  entries.forEach(entry => {
    sentenceBuffer.push(entry.word);
    if (entry.isSentenceBoundary) {
      txt += `- ${sentenceBuffer.join(" ")}\n`;
      sentenceBuffer = [];
    }
  });

  if (sentenceBuffer.length > 0) {
    txt += `- ${sentenceBuffer.join(" ")}\n`;
  }

  return txt;
}

export function exportToCSV(session: Session, entries: TranscriptEntry[]): string {
  let csv = "Timestamp,Label,Word,Confidence,IsBoundary\n";
  entries.forEach(e => {
    const time = new Date(e.timestamp).toISOString();
    csv += `"${time}","${e.label}","${e.word}",${e.score.toFixed(3)},${e.isSentenceBoundary}\n`;
  });
  return csv;
}

export function exportToJSON(session: Session, entries: TranscriptEntry[]): string {
  return JSON.stringify({
    schema_version: "1.0",
    session,
    entries: entries.map(e => ({
      timestamp: e.timestamp,
      label: e.label,
      word: e.word,
      score: e.score,
      isSentenceBoundary: e.isSentenceBoundary
    }))
  }, null, 2);
}

export function triggerDownload(filename: string, content: string, mimeType: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
