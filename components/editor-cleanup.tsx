"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api, type Project, type Revision } from "@/lib/studio";
import styles from "./editor-finishing.module.css";

function speechTime(value: number) {
  const tenths = Math.round(value * 10);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, "0")}`;
}

export function EditorCleanup({
  project,
  selected,
  disabled,
  aiAvailable,
  onReload,
  onSeek,
}: {
  project: Project;
  selected?: Revision;
  disabled: boolean;
  aiAvailable: boolean;
  onReload: () => Promise<void>;
  onSeek: (time: number) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const review =
    project.cleanup?.transcript_id === project.transcript_id
      ? project.cleanup
      : undefined;
  const busy = disabled || pending;
  async function request(apply: boolean) {
    setPending(true);
    setError("");
    try {
      await api(
        `/projects/${project.id}/cleanup${apply ? "/apply" : ""}`,
        "POST",
        apply
          ? {
              review_id: review?.id,
              transcript_id: project.transcript_id,
              revision: selected?.id,
              suggestions: checked,
            }
          : {},
      );
      setChecked([]);
      await onReload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className={styles.cleanup} aria-label="Speech cleanup">
      <div className={styles.cleanupHeading}>
        <h3>Speech cleanup</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || !aiAvailable}
          onClick={() => void request(false)}
        >
          {project.job?.kind === "cleanup" && disabled
            ? "Reviewing speech…"
            : review
              ? "Find again"
              : "Find speech cleanup"}
        </Button>
      </div>
      <p className={styles.note}>
        {!aiAvailable
          ? "Connect an AI provider on the backend to find retakes and filler words."
          : "Review each suggestion against the source. Selected removals create a new revision."}
      </p>
      {!project.analysis?.words.length && (
        <p className={styles.note}>
          Imported subtitles support take comparisons. Individual filler removal
          needs word timings from transcription.
        </p>
      )}
      {review && review.suggestions.length === 0 && (
        <p className={styles.note} role="status">
          No confident suggestions found. You can still select transcript lines
          manually below.
        </p>
      )}
      {review?.suggestions.map((suggestion) => {
        const present = selected?.plan.cuts.some(
          (c) =>
            Math.min(c.end, suggestion.end) >
            Math.max(c.start, suggestion.start),
        );
        const keep = suggestion.keep;
        const replacementPresent =
          !keep ||
          selected?.plan.cuts.some(
            (c) => c.start <= keep.start && c.end >= keep.end,
          );
        const eligible = present && replacementPresent;
        return (
          <div className={styles.suggestion} key={suggestion.id}>
            <label className={styles.suggestionTitle}>
              <input
                type="checkbox"
                aria-label={`Remove suggestion: ${suggestion.text}`}
                checked={checked.includes(suggestion.id)}
                disabled={busy || !eligible}
                onChange={(e) =>
                  setChecked((current) =>
                    e.target.checked
                      ? [...current, suggestion.id]
                      : current.filter((id) => id !== suggestion.id),
                  )
                }
              />
              {suggestion.kind === "retake" ? "Possible retake" : "Filler word"}
              <span>{(suggestion.end - suggestion.start).toFixed(1)}s</span>
            </label>
            <button
              className={styles.speechQuote}
              onClick={() => onSeek(suggestion.start)}
              aria-label={`Review proposed removal: ${suggestion.text}`}
            >
              <time>
                {speechTime(suggestion.start)} — {speechTime(suggestion.end)}
              </time>
              <span>{suggestion.text}</span>
            </button>
            {keep && (
              <button
                className={styles.speechQuote}
                onClick={() => onSeek(keep.start)}
                aria-label={`Review replacement take: ${keep.text}`}
              >
                <time>Keep · {speechTime(keep.start)}</time>
                <span>{keep.text}</span>
              </button>
            )}
            <p className={styles.note}>{suggestion.reason}</p>
            {selected && !eligible && (
              <p className={styles.note}>
                {!present
                  ? "Already absent from this edit."
                  : "The complete replacement take is missing from this edit."}
              </p>
            )}
          </div>
        );
      })}
      {!!review?.suggestions.length && !selected && (
        <p className={styles.note}>Create a first cut to apply suggestions.</p>
      )}
      {checked.length > 0 && (
        <Button
          variant="outline"
          disabled={busy || !selected}
          onClick={() => void request(true)}
        >
          Apply {checked.length} selected
        </Button>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
