"use client";
import { useState } from "react";
import { csrfHeaders, clearCsrf } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { api, type Health, type Finishing, type Project } from "@/lib/studio";
import { uploadMusic } from "@/lib/uploads";
import styles from "./editor-finishing.module.css";

export function EditorFinishing({
  project,
  value,
  onChange,
  disabled,
  hasRevision,
  onApply,
  onReload,
}: {
  project: Project;
  value: Finishing;
  onChange: (value: Finishing) => void;
  disabled: boolean;
  hasRevision: boolean;
  onApply: () => void;
  onReload: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  function patch(update: Partial<Finishing>) {
    onChange({ ...value, ...update });
  }
  async function upload(file: File) {
    setError("");
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose a music file under 20 MB.");
      return;
    }
    setUploading(true);
    try {
      const health = await api<Health>("/health");
      if (health.storage === "s3") {
        const result = await uploadMusic(file, project.id);
        await onReload();
        for (let attempt = 0; attempt < 60; attempt++) {
          const latest = await api<Project>(`/projects/${project.id}`);
          if (latest.music?.some((track) => track.id === result.asset_id)) {
            await onReload(); patch({ music_id: result.asset_id }); return;
          }
          if (latest.job?.id === result.job_id && ["failed", "cancelled"].includes(latest.job.status)) throw new Error(latest.job.message);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        throw new Error("Music is still processing. It will appear in your track list when ready.");
      }
      const form = new FormData();
      form.append("file", file);
      let result;
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(`/api/projects/${project.id}/music`, {
          method: "POST",
          headers: await csrfHeaders(),
          body: form,
          credentials: "same-origin",
        });
        result = await response.json();
        if (result.code === "csrf_invalid" && attempt === 0) {
          clearCsrf();
          continue;
        }
        if (!response.ok)
          throw new Error(result.error || "Music upload failed.");
        await onReload();
        patch({ music_id: result.id });
        return;
      }
      throw new Error("Your session changed. Please try again.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <details className={styles.section}>
      <summary>Style &amp; sound</summary>
      <fieldset className={styles.fields} disabled={disabled || uploading}>
        <label className={styles.field}>
          Subject framing
          <select value={value.framing ?? "manual"} onChange={(e) => patch({ framing: e.target.value as "auto" | "manual" })}>
            <option value="auto">Follow subject automatically</option>
            <option value="manual">Set framing manually</option>
          </select>
        </label>
        {value.framing === "auto" && (
          <>
            <p className={styles.note}>Keeps a wider frame when the subject cannot be followed confidently.</p>
            {!!project.analysis?.tracking?.subjects.length && (
              <label className={styles.field}>Subject
                <select value={value.subject_id ?? ""} onChange={(e) => patch({ subject_id: e.target.value || null })}>
                  <option value="">Automatic selection</option>
                  {project.analysis.tracking.subjects.map((id, i) => <option key={id} value={id}>Subject {i + 1}</option>)}
                </select>
              </label>
            )}
          </>
        )}
        {value.framing !== "auto" && <>
        <label className={styles.field}>
          Framing
          <select
            value={value.fit}
            onChange={(e) => patch({ fit: e.target.value as Finishing["fit"] })}
          >
            <option value="contain">Keep full frame</option>
            <option value="cover">Fill frame</option>
          </select>
        </label>
        {value.fit === "cover" && (
          <>
            <label className={styles.field}>
              Horizontal focus{" "}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={value.focus_x ?? 0.5}
                onChange={(e) => patch({ focus_x: +e.target.value })}
              />
            </label>
            <label className={styles.field}>
              Vertical focus{" "}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={value.focus_y ?? 0.5}
                onChange={(e) => patch({ focus_y: +e.target.value })}
              />
            </label>
            <p className={styles.note}>
              Choose where the crop sits. Focus is fixed; it does not track the
              speaker.
            </p>
          </>
        )}
        </>}
        <label className={styles.field}>
          Motion
          <select
            value={value.motion ?? "none"}
            onChange={(e) =>
              patch({
                motion: e.target.value as Finishing["motion"],
                ...(e.target.value !== "none" ? { fit: "cover" } : {}),
              })
            }
          >
            <option value="none">Steady</option>
            <option value="push">Gentle push-in</option>
            <option value="punch">Emphasize key moments</option>
          </select>
        </label>
        {value.motion === "punch" && (
          <p className={styles.note}>
            Uses analyzed speech moments for restrained punch-ins. Stays steady when no moments are identified.
          </p>
        )}
        <label className={styles.field}>
          Color
          <select
            value={value.look}
            onChange={(e) =>
              patch({ look: e.target.value as Finishing["look"] })
            }
          >
            <option value="natural">Natural</option>
            <option value="cinematic">Cinematic</option>
            <option value="warm">Warm</option>
            <option value="mono">Black &amp; white</option>
          </select>
        </label>
        <label className={styles.field}>
          Caption style
          <select
            value={value.caption_style ?? "clean"}
            onChange={(e) =>
              patch({
                caption_style: e.target.value as Finishing["caption_style"],
              })
            }
          >
            <option value="clean">Clean phrases</option>
            <option value="highlight">Word highlight</option>
            <option value="bold">Bold pop</option>
          </select>
        </label>
        {value.caption_style === "highlight" &&
          !project.analysis?.words.length && (
            <p className={styles.note}>
              Word highlighting needs transcription with word timing. Imported
              subtitles display as clean phrases.
            </p>
          )}
        <label className={styles.field}>
          Caption position
          <select
            value={value.caption_position ?? "lower"}
            onChange={(e) =>
              patch({
                caption_position: e.target
                  .value as Finishing["caption_position"],
              })
            }
          >
            <option value="lower">Lower safe area</option>
            <option value="center">Center</option>
          </select>
        </label>
        <label className={styles.field}>
          Opening &amp; closing fade
          <select
            value={value.fade ?? 0}
            onChange={(e) => patch({ fade: +e.target.value })}
          >
            <option value="0">None</option>
            <option value="0.5">Soft · 0.5 seconds</option>
            <option value="1">Slow · 1 second</option>
          </select>
        </label>
        <label className={styles.row}>
          Level speech audio{" "}
          <input
            type="checkbox"
            checked={value.normalize_audio}
            onChange={(e) => patch({ normalize_audio: e.target.checked })}
          />
        </label>
        <label className={styles.row}>
          Reduce background noise{" "}
          <input
            type="checkbox"
            checked={value.denoise ?? false}
            onChange={(e) => patch({ denoise: e.target.checked })}
          />
        </label>
        <label className={styles.field}>
          Music
          <select
            value={value.music_id ?? ""}
            onChange={(e) => patch({ music_id: e.target.value || null })}
          >
            <option value="">No music</option>
            {project.music?.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </label>
        {(project.music?.length ?? 0) < 8 && (
          <label className={styles.field}>
            Upload a track
            <input
              className={styles.file}
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
        )}
        <p className={styles.note}>
          {uploading
            ? "Uploading music…"
            : "Use your own or licensed music. MP3, WAV or M4A, up to 20 MB. Tracks loop to fit, with a soft fade."}
        </p>
        {value.music_id && (
          <>
            <audio
              className={styles.audio}
              controls
              preload="none"
              src={`/api/projects/${project.id}/music/${value.music_id}`}
              aria-label="Preview selected music"
            />
            <label className={styles.field}>
              Music level · {Math.round((value.music_volume ?? 0.15) * 100)}%{" "}
              <input
                type="range"
                min="0"
                max=".5"
                step=".01"
                value={value.music_volume ?? 0.15}
                onChange={(e) => patch({ music_volume: +e.target.value })}
              />
            </label>
            <label className={styles.row}>
              Lower music under speech{" "}
              <input
                type="checkbox"
                checked={value.music_duck ?? true}
                onChange={(e) => patch({ music_duck: e.target.checked })}
              />
            </label>
          </>
        )}
        <p className={styles.note}>
          Changes appear in the next rendered preview and export.
        </p>
        {hasRevision && (
          <Button variant="outline" onClick={onApply}>
            Apply style to this edit
          </Button>
        )}
      </fieldset>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </details>
  );
}
