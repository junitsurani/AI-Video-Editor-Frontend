"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api, duration, type Project, type Revision } from "@/lib/studio";
import styles from "./editor-finishing.module.css";
import { EditorCleanup } from "./editor-cleanup";

export function EditorTranscript({
  project,
  selected,
  disabled,
  aiAvailable,
  onReload,
  onSeek,
  onCut,
}: {
  project: Project;
  selected?: Revision;
  disabled: boolean;
  aiAvailable: boolean;
  onReload: () => Promise<void>;
  onSeek: (time: number) => void;
  onCut: (indices: number[]) => void;
}) {
  const [excluded, setExcluded] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function importFile(file: File) {
    setError("");
    if (file.size > 500_000) {
      setError("Choose an SRT file under 500 KB.");
      return;
    }
    setLoading(true);
    try {
      await api(`/projects/${project.id}/transcript`, "POST", {
        srt: await file.text(),
      });
      setExcluded([]);
      await onReload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="transcript-panel">
      <div className={styles.transcriptTools}>
        <label className={styles.field}>
          {project.analysis?.segments.length
            ? "Replace subtitles"
            : "Import subtitles"}
          <input
            className={styles.file}
            type="file"
            accept=".srt"
            disabled={disabled || loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importFile(file);
            }}
          />
        </label>
        <p className={styles.note}>
          {loading
            ? "Importing subtitles…"
            : "Use an SRT file timed to the original footage. Saved edits keep their existing subtitles."}
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
      {project.analysis?.segments.length ? (
        <>
          <EditorCleanup
            key={`${project.cleanup?.id || "new"}:${selected?.id || "original"}`}
            project={project}
            selected={selected}
            disabled={disabled || loading}
            aiAvailable={aiAvailable}
            onReload={onReload}
            onSeek={onSeek}
          />
          <p className={styles.note}>
            Click a timestamp to review the source. Select lines to remove from
            the current edit.
          </p>
          {excluded.length > 0 && (
            <div className={styles.selection}>
              <Button
                variant="outline"
                disabled={disabled || loading || !selected}
                onClick={() => {
                  onCut(excluded);
                  setExcluded([]);
                }}
              >
                Remove {excluded.length}{" "}
                {excluded.length === 1 ? "line" : "lines"} from edit
              </Button>
              {!selected && (
                <p className={styles.note}>
                  Create a first cut before removing lines.
                </p>
              )}
            </div>
          )}
          {project.analysis.segments.map((cue, i) => {
            const removed =
              !!selected &&
              !selected.plan.cuts.some(
                (cut) =>
                  Math.min(cut.end, cue.end) > Math.max(cut.start, cue.start),
              );
            return (
              <div
                key={i}
                className={styles.cue}
                data-excluded={removed || excluded.includes(i)}
              >
                <input
                  type="checkbox"
                  aria-label={`${removed ? "Removed" : "Remove"} line ${i + 1}: ${cue.text}`}
                  checked={removed || excluded.includes(i)}
                  disabled={disabled || loading || removed}
                  onChange={(e) =>
                    setExcluded(
                      e.target.checked
                        ? [...excluded, i]
                        : excluded.filter((n) => n !== i),
                    )
                  }
                />
                <button onClick={() => onSeek(cue.start)}>
                  <time>
                    {duration(cue.start)} — {duration(cue.end)}
                  </time>
                  {cue.text}
                </button>
              </div>
            );
          })}
        </>
      ) : (
        <div className="panel-empty">
          <h3>Your words will appear here</h3>
          <p>
            Import subtitles now, or connect AI and analyze your video to
            transcribe it.
          </p>
        </div>
      )}
    </div>
  );
}
