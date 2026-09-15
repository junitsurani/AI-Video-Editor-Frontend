"use client";
import { useState } from 'react';
import { api, type Project } from '@/lib/studio';
import { Button } from '@/components/ui/button';
import styles from './editor-finishing.module.css';

export function TranscriptCorrection({ project, index, disabled, onReload }: {
  project: Project; index: number; disabled: boolean; onReload: () => Promise<void>;
}) {
  const cue = project.analysis!.segments[index];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(cue.text);
  const [words, setWords] = useState(() => project.analysis!.words.filter((w) => w.start >= cue.start && w.end <= cue.end));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    try {
      await api(`/projects/${project.id}/transcript`, 'PATCH', { transcript_id: project.transcript_id, segment: index, text, words });
      await onReload(); setOpen(false);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div className={styles.correction}>
    <button type="button" disabled={disabled || busy} aria-expanded={open} onClick={() => setOpen(!open)}>Correct text &amp; timing</button>
    {open && <fieldset disabled={disabled || busy}>
      <label className={styles.field}>Transcript line<textarea value={text} onChange={(e) => setText(e.target.value)} /></label>
      {!!words.length && <details><summary>Word timings · source seconds</summary>
        {words.map((word, i) => <div className={styles.wordRow} key={i}>
          <input aria-label={`Word ${i + 1}`} value={word.word} onChange={(e) => setWords(words.map((w, n) => n === i ? { ...w, word: e.target.value } : w))} />
          <input aria-label={`Word ${i + 1} start`} type="number" step=".01" value={word.start} onChange={(e) => setWords(words.map((w, n) => n === i ? { ...w, start: +e.target.value } : w))} />
          <input aria-label={`Word ${i + 1} end`} type="number" step=".01" value={word.end} onChange={(e) => setWords(words.map((w, n) => n === i ? { ...w, end: +e.target.value } : w))} />
        </div>)}
        <button type="button" onClick={() => setWords([])}>Use phrase captions for this line</button>
      </details>}
      <p className={styles.note}>Saved edits keep their original captions. Apply an edit after saving to preview this correction.</p>
      <Button variant="outline" onClick={save}>{busy ? 'Saving…' : 'Save correction'}</Button>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </fieldset>}
  </div>;
}
