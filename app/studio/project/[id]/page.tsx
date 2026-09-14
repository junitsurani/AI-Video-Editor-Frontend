"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Captions,
  Clock3,
  Film,
  LoaderCircle,
  Scissors,
  Sparkles,
  SlidersHorizontal,
  WandSparkles,
  RefreshCw,
} from "lucide-react";
import { StudioShell } from "@/components/studio-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  api,
  modes,
  duration,
  type Project,
  type Plan,
  type Health,
  type Revision,
} from "@/lib/studio";
export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("9:16");
  const [captions, setCaptions] = useState(false);
  const [removeSilence, setRemoveSilence] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [panel, setPanel] = useState("edit");
  const [revisionId, setRevisionId] = useState("");
  const [viewSource, setViewSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const [trimStart, setTrimStart] = useState("0");
  const [trimEnd, setTrimEnd] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const initial = useRef(false);
  const load = useCallback(async () => {
    try {
      const p = await api<Project>("/projects/" + id);
      setProject(p);
      setError("");
      if (!initial.current) {
        setAspect(p.revisions.at(-1)?.plan.aspect || (p.mode === "course" ? "16:9" : "9:16"));
        setCaptions(p.revisions.at(-1)?.plan.captions || false);
        setTrimEnd(p.info.duration.toFixed(2));
        initial.current = true;
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    load();
    api<Health>("/health")
      .then(setHealth)
      .catch(() => {});
  }, [load]);
  const processing =
    busy ||
    project?.job?.status === "queued" ||
    project?.job?.status === "running";
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(load, 1600);
    return () => clearInterval(timer);
  }, [processing, load]);
  const selected: Revision | undefined =
    project?.revisions.find((r) => r.id === revisionId) ||
    project?.revisions.at(-1);
  const mode = modes.find((m) => m.id === project?.mode);
  async function action(path: string, data: unknown) {
    setActionError("");
    setBusy(true);
    try {
      await api("/projects/" + id + path, "POST", data);
      setRevisionId("");
      setViewSource(false);
      await load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function analyze() {
    action("/analyze", {
      aspect,
      captions,
      remove_silence: removeSilence,
      prompt,
    });
  }
  function manual() {
    if (!project) return;
    const plan: Plan = {
      cuts: [{ start: Number(trimStart), end: Number(trimEnd) }],
      aspect,
      captions,
      normalize_audio: true,
      look: project.mode === "inspirational" ? "cinematic" : "natural",
      fit: "contain",
    };
    action("/revisions", { plan, prompt: "Manual trim and framing" });
  }
  return (
    <StudioShell section="Project">
      <main className="editor-page">
        {error ? (
          <div className="empty-projects">
            <h2>Couldn’t open this project</h2>
            <p role="alert">{error}</p>
            <Button onClick={load}>Retry</Button>
            <Link href="/studio">Back to workspace</Link>
          </div>
        ) : !project ? (
          <div className="empty-projects">
            <LoaderCircle className="spin" />
            <p>Opening your project…</p>
          </div>
        ) : (
          <>
            <div className="editor-title">
              <div>
                <Link className="back-link" href="/studio">
                  <ArrowLeft size={15} /> All projects
                </Link>
                <h1>{project.name}</h1>
                <p>
                  {mode?.title}
                  <span>·</span>
                  {duration(project.info.duration)} original<span>·</span>
                  {project.info.width} × {project.info.height}
                </p>
              </div>
              <div className="export-controls">
                {selected?.export_url ? (
                  <Button asChild>
                    <a href={selected.export_url + "&download=1"}>
                      <ArrowDownToLine size={16} /> Download 1080p
                    </a>
                  </Button>
                ) : (
                  <Button
                    disabled={!selected || processing}
                    onClick={() =>
                      action("/export", { revision: selected?.id })
                    }
                  >
                    <ArrowDownToLine size={16} /> Export video
                  </Button>
                )}
              </div>
            </div>
            <div className="editor-grid">
              <section className="preview-column">
                <div className="preview-card">
                  <div className="preview-bar">
                    <span>
                      <Film size={14} />{" "}
                      {viewSource || !selected
                        ? "Original footage"
                        : "Your edit"}
                    </span>
                    <div>
                      {selected && (
                        <>
                          <button
                            className={viewSource ? "active" : ""}
                            onClick={() => setViewSource(true)}
                          >
                            Original
                          </button>
                          <button
                            className={!viewSource ? "active" : ""}
                            onClick={() => setViewSource(false)}
                          >
                            Edit {project.revisions.indexOf(selected) + 1}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={
                      "video-stage " +
                      (!viewSource && selected?.plan.aspect === "9:16"
                        ? "portrait"
                        : "")
                    }
                  >
                    <video
                      key={viewSource ? "source" : selected?.id || "source"}
                      ref={video}
                      src={
                        !viewSource && selected
                          ? selected.preview_url
                          : project.source_url
                      }
                      controls
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={() => {
                        if (pendingSeek.current !== null && video.current) {
                          video.current.currentTime = pendingSeek.current;
                          pendingSeek.current = null;
                        }
                      }}
                      poster={project.thumbnail_url}
                    />
                  </div>
                  <div className="preview-bottom">
                    <span>
                      <CheckCircle2 size={14} /> Original preserved
                    </span>
                    <span>
                      {!viewSource && selected
                        ? selected.plan.aspect + " · 720p preview"
                        : "Source preview"}
                    </span>
                  </div>
                </div>
                {processing && (
                  <div className="job-progress" role="status">
                    <div className="job-top">
                      <LoaderCircle size={20} className="spin" />
                      <div>
                        <strong>
                          {project.job?.message || "Starting your edit"}
                        </strong>
                        <span>
                          You can leave this page. Your project will be here
                          when you return.
                        </span>
                      </div>
                      <b>{project.job?.progress || 0}%</b>
                    </div>
                    <progress value={project.job?.progress || 0} max={100} />
                  </div>
                )}
                {project.job?.status === "failed" && !processing && (
                  <div className="error-message" role="alert">
                    {project.job.message}
                  </div>
                )}
                {actionError && (
                  <div className="error-message" role="alert">
                    {actionError}
                  </div>
                )}
                {selected && (
                  <section className="revision-prompt">
                    <div>
                      <Sparkles size={18} />
                      <h2>Make it feel like you.</h2>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (prompt.trim()) action("/revisions", { prompt, base_revision: selected.id });
                      }}
                    >
                      <Input
                        aria-label="Describe an edit revision"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Tell us what to change…"
                        disabled={processing}
                      />
                      <Button
                        aria-label="Apply revision"
                        type="submit"
                        disabled={!prompt.trim() || processing}
                      >
                        <ArrowUp size={18} />
                      </Button>
                    </form>
                    <div className="prompt-suggestions">
                      {[
                        "Make it vertical",
                        "Make it landscape",
                        "Remove captions",
                      ].map((s) => (
                        <button
                          key={s}
                          disabled={processing}
                          onClick={() => setPrompt(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {!health?.ai_configured && (
                      <p className="subtle-note">
                        Framing and caption removal work now. Connect AI for
                        other prompt revisions.
                      </p>
                    )}
                  </section>
                )}
                {project.clips.length > 0 && (
                  <section className="clips-section">
                    <div className="workspace-section-heading">
                      <h2>
                        Your standout moments{" "}
                        <span className="count">{project.clips.length}</span>
                      </h2>
                    </div>
                    {project.clips.map((c, i) => (
                      <article className="clip-candidate" key={c.id}>
                        <span className="clip-rank">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{c.title}</h3>
                          <p className="clip-hook">“{c.hook}”</p>
                          <p>{c.reason}</p>
                          <span>
                            {duration(c.start)} – {duration(c.end)} ·{" "}
                            {duration(c.end - c.start)} · Relevance{" "}
                            {Math.round(c.score)}/100
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          disabled={processing}
                          onClick={() => action("/clips/" + c.id, {})}
                        >
                          Edit clip <ArrowUp size={14} />
                        </Button>
                      </article>
                    ))}
                  </section>
                )}
              </section>
              <aside className="edit-panel">
                <div className="panel-tabs">
                  {[
                    ["edit", "Edit settings"],
                    ["transcript", "Transcript"],
                    ["history", "History"],
                  ].map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setPanel(k)}
                      className={panel === k ? "active" : ""}
                    >
                      {v}
                      {k === "history" && project.revisions.length > 0 && (
                        <span>{project.revisions.length}</span>
                      )}
                    </button>
                  ))}
                </div>
                {panel === "edit" ? (
                  <div className="settings-content">
                    <span className="panel-eyebrow">
                      {mode?.title.toUpperCase()}
                    </span>
                    <h2>
                      {selected
                        ? "Shape your next cut"
                        : "Let’s make the first cut"}
                    </h2>
                    <p>{mode?.detail}</p>
                    <div className="setting-group">
                      <label className="field-heading">Format</label>
                      <div className="format-buttons">
                        <button
                          className={aspect === "9:16" ? "selected" : ""}
                          onClick={() => setAspect("9:16")}
                        >
                          <span className="ratio-portrait" />
                          9:16 <small>Portrait</small>
                          {aspect === "9:16" && <Check size={13} />}
                        </button>
                        <button
                          className={aspect === "16:9" ? "selected" : ""}
                          onClick={() => setAspect("16:9")}
                        >
                          <span className="ratio-landscape" />
                          16:9 <small>Landscape</small>
                          {aspect === "16:9" && <Check size={13} />}
                        </button>
                      </div>
                      <p className="subtle-note">
                        Full frame is preserved with letterboxing.
                      </p>
                    </div>
                    <div className="setting-toggle">
                      <div>
                        <label htmlFor="remove-pauses">
                          Remove long pauses
                        </label>
                        <span>Keep the flow, lose the dead air.</span>
                      </div>
                      <Switch
                        id="remove-pauses"
                        checked={removeSilence}
                        onCheckedChange={setRemoveSilence}
                      />
                    </div>
                    <div className="setting-toggle">
                      <div>
                        <label htmlFor="captions">Word-by-word captions</label>
                        <span>
                          {health?.ai_configured ||
                          project.analysis?.segments.length
                            ? "Clear words, timed to your voice."
                            : "Requires AI transcription."}
                        </span>
                      </div>
                      <Switch
                        id="captions"
                        checked={captions}
                        onCheckedChange={setCaptions}
                        disabled={
                          !health?.ai_configured &&
                          !project.analysis?.segments.length
                        }
                      />
                    </div>
                    {project.mode === "clips" && (
                      <div className="setting-group">
                        <label
                          className="field-heading"
                          htmlFor="clip-direction"
                        >
                          Look for moments about
                        </label>
                        <Input
                          id="clip-direction"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g. discipline, building a business"
                        />
                      </div>
                    )}
                    <Button
                      className="generate-button"
                      disabled={
                        processing ||
                        (!health?.ai_configured && project.mode === "clips")
                      }
                      onClick={analyze}
                    >
                      {processing ? (
                        <LoaderCircle className="spin" size={17} />
                      ) : (
                        <WandSparkles size={17} />
                      )}{" "}
                      {project.mode === "clips"
                        ? "Find highlights"
                        : selected
                          ? "Generate a new cut"
                          : "Create first cut"}
                    </Button>
                    {!health?.ai_configured && (
                      <div className="provider-note">
                        <Sparkles size={16} />
                        <p>
                          {project.mode === "clips"
                            ? "Connect an AI provider to find meaningful highlights. You can make a manual clip below."
                            : "Automatic silence removal, audio leveling, framing, and rendering are ready. Connect AI to enable transcription and semantic revisions."}
                        </p>
                      </div>
                    )}
                    <details className="manual-edit">
                      <summary>
                        <SlidersHorizontal size={16} /> Manual trim
                      </summary>
                      <p className="subtle-note">
                        Choose a range in seconds from your original.
                      </p>
                      <div className="trim-inputs">
                        <label>
                          Start
                          <Input
                            type="number"
                            min="0"
                            max={project.info.duration}
                            step="0.1"
                            value={trimStart}
                            onChange={(e) => setTrimStart(e.target.value)}
                          />
                        </label>
                        <label>
                          End
                          <Input
                            type="number"
                            min="0.1"
                            max={project.info.duration}
                            step="0.1"
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(e.target.value)}
                          />
                        </label>
                      </div>
                      <Button
                        variant="outline"
                        disabled={
                          processing || Number(trimEnd) <= Number(trimStart)
                        }
                        onClick={manual}
                      >
                        <Scissors size={14} /> Create this cut
                      </Button>
                    </details>
                    {project.analysis && (
                      <div className="analysis-summary">
                        <span>
                          <CheckCircle2 size={14} /> Analysis cached
                        </span>
                        <p>
                          {project.analysis.silences.length} pauses ·{" "}
                          {project.analysis.scenes.length} scene changes
                        </p>
                      </div>
                    )}
                  </div>
                ) : panel === "transcript" ? (
                  <div className="transcript-panel">
                    {project.analysis?.segments.length ? (
                      <>
                        <p className="subtle-note">
                          Click a timestamp to jump to the original.
                        </p>
                        {project.analysis.segments.map((s, i) => (
                          <button
                            key={i}
                            className="transcript-line"
                            onClick={() => {
                              pendingSeek.current = s.start;
                              setViewSource(true);
                              if (viewSource && video.current) {
                                video.current.currentTime = s.start;
                                pendingSeek.current = null;
                              }
                            }}
                          >
                            <span>{duration(s.start)}</span>
                            <p>{s.text}</p>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="panel-empty">
                        <Captions size={28} />
                        <h3>Your words will appear here</h3>
                        <p>
                          {health?.ai_configured
                            ? "Analyze your video to create a timestamped transcript."
                            : "Connect an AI provider and analyze your video to generate a transcript."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="history-panel">
                    {project.revisions.length ? (
                      project.revisions.toReversed().map((r, i) => (
                        <button
                          className={
                            "history-row " +
                            (selected?.id === r.id ? "active" : "")
                          }
                          key={r.id}
                          onClick={() => {
                            setRevisionId(r.id);
                            setViewSource(false);
                          }}
                        >
                          <Clock3 size={17} />
                          <div>
                            <strong>Edit {project.revisions.length - i}</strong>
                            <p>{r.prompt}</p>
                            <span>
                              {new Date(r.created_at).toLocaleString()}
                            </span>
                          </div>
                          {selected?.id === r.id && <Check size={15} />}
                        </button>
                      ))
                    ) : (
                      <div className="panel-empty">
                        <Clock3 size={28} />
                        <h3>A fresh start</h3>
                        <p>
                          Every completed edit is saved here. Revisit any
                          version without changing the original.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </StudioShell>
  );
}
