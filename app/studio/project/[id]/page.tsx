"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  Clock3,
  Film,
  LoaderCircle,
  Scissors,
  Sparkles,
  SlidersHorizontal,
  WandSparkles,
} from "lucide-react";
import { TimecodeField } from "@/components/timecode-field";
import { EditorFinishing } from "@/components/editor-finishing";
import { EditorMedia } from "@/components/editor-media";
import { EditorTranscript } from "@/components/editor-transcript";
import { StudioShell } from "@/components/studio-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  api,
  modes,
  laterModes,
  lookPresets,
  duration,
  type Project,
  type Plan,
  type Finishing,
  type Health,
  type Revision,
  type LookPreset,
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
  const [finishing, setFinishing] = useState<Finishing>({
    look: "natural",
    fit: "contain",
    normalize_audio: true,
  });
  const [removeSilence, setRemoveSilence] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [clipCount, setClipCount] = useState(5);
  const [clipMin, setClipMin] = useState(20);
  const [clipMax, setClipMax] = useState(90);
  const [clipLayout, setClipLayout] = useState<"separate" | "combined">("separate");
  const [chosenClips, setChosenClips] = useState<string[]>([]);
  const [lookPreset, setLookPreset] = useState<LookPreset>("simple");
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [clarifyOption, setClarifyOption] = useState("");
  const [panel, setPanel] = useState("edit");
  const [revisionId, setRevisionId] = useState("");
  const [viewSource, setViewSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const initial = useRef(false);
  const receiveProject = useCallback((p: Project) => {
    setProject(p);
    setError("");
    if (!initial.current) {
      const combined = p.mode === "clips" && Boolean(p.clip_options?.combine_reel);
      if (p.mode === "clips") setClipLayout(combined ? "combined" : "separate");
      setAspect(
        p.revisions.at(-1)?.plan.aspect ||
          p.clip_options?.aspect ||
          (p.mode === "course" || combined ? "16:9" : "9:16"),
      );
      setCaptions(
        p.revisions.at(-1)?.plan.captions ?? p.mode !== "course",
      );
      setFinishing(
        p.revisions.at(-1)?.plan || {
          look: p.mode === "inspirational" ? "cinematic" : "natural",
          fit: "contain",
          framing: p.mode === "course" ? "manual" : "auto",
          motion:
            p.mode === "inspirational"
              ? "push"
              : p.mode === "course"
                ? "none"
                : "punch",
          caption_style: p.mode === "course" ? "clean" : "highlight",
          normalize_audio: true,
        },
      );
      setTrimStart(0);
      setTrimEnd(p.info.duration);
      if (p.look_preset) setLookPreset(p.look_preset);
      initial.current = p.info.duration > 0;
    }
  }, []);
  const load = useCallback(async () => {
    try {
      receiveProject(await api<Project>("/projects/" + id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, receiveProject]);
  useEffect(() => {
    let active = true;
    api<Project>("/projects/" + id)
      .then((p) => {
        if (active) receiveProject(p);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    api<Health>("/health")
      .then((h) => {
        if (active) setHealth(h);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, receiveProject]);
  const jobBusy =
    project?.job?.status === "queued" || project?.job?.status === "running";
  const processing = busy || jobBusy;
  const preparingSource =
    project?.status === "ingesting" ||
    (jobBusy && project?.job?.kind === "ingest");
  const sourceReady =
    !!project?.info.duration && project?.status !== "ingesting";
  const styleLocked = busy || (jobBusy && project?.job?.kind !== "ingest");
  useEffect(() => {
    if (!processing && project?.status !== "ingesting") return;
    const timer = setInterval(load, 1600);
    return () => clearInterval(timer);
  }, [processing, project?.status, load]);
  const selected: Revision | undefined =
    project?.revisions.find((r) => r.id === revisionId) ||
    project?.revisions.at(-1);
  const waitingOnFirstEdit = !project?.revisions.length;
  const job = project?.job ?? null;
  const showClarify =
    job != null && job.status === "needs_input" && !processing && waitingOnFirstEdit;
  const [draftRevision, setDraftRevision] = useState("");
  // Reset the editable draft only when a different saved revision is selected.
  if (selected && draftRevision !== selected.id) {
    setDraftRevision(selected.id);
    setFinishing(selected.plan);
    setAspect(selected.plan.aspect);
    setCaptions(selected.plan.captions);
  }
  const mode = modes.find((m) => m.id === project?.mode) || laterModes.find((m) => m.id === project?.mode);
  async function action(path: string, data: unknown) {
    setActionError("");
    setBusy(true);
    try {
      await api("/projects/" + id + path, "POST", data);
      setRevisionId("");
      setViewSource(false);
      setRevisionPrompt("");
      setClarifyAnswer("");
      setClarifyOption("");
      await load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function analyze() {
    action("/analyze", {
      ...finishing,
      aspect,
      captions,
      remove_silence: removeSilence,
      clip_count: clipCount,
      clip_min_seconds: clipMin,
      clip_max_seconds: clipMax,
      prompt,
      combine_reel: project?.mode === "clips" ? clipLayout === "combined" : undefined,
      look_preset: project?.mode === "social" ? lookPreset : undefined,
    });
  }
  function manual() {
    if (!project) return;
    const plan: Plan = {
      ...finishing,
      cuts: [{ start: trimStart, end: trimEnd }],
      aspect,
      captions,
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
                          ? `${selected.preview_url}${selected.preview_url.includes("?") ? "&" : "?"}v=${encodeURIComponent(selected.created_at)}`
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
                          {job && (job.status === "running" || job.status === "queued")
                            ? job.message
                            : preparingSource
                              ? "Preparing your uploaded video"
                              : "Starting your edit"}
                        </strong>
                        <span>
                          You can leave this page. Your project will be here
                          when you return.
                        </span>
                      </div>
                      <b>{job?.status === "running" ? job.progress : 0}%</b>
                    </div>
                    <progress value={job?.status === "running" ? job.progress : 0} max={100} />
                    {job && !busy && <Button variant="ghost" size="sm" onClick={() => action(`/jobs/${job.id}/cancel`, {})}>Cancel processing</Button>}
                  </div>
                )}
                {job && (job.status === "failed" || job.status === "cancelled") && !processing && (
                  <div className="error-message" role="alert">
                    {job.message}
                    {job.status === "failed" && (
                      <Button variant="outline" size="sm" onClick={() => action(`/jobs/${job.id}/retry`, {})}>Retry</Button>
                    )}
                  </div>
                )}
                {showClarify && job && (
                  <div className="clarify-panel" role="form">
                    <Sparkles size={16} />
                    <div>
                      <strong>One thing before this first edit can continue</strong>
                      <p>{job.clarification?.question || job.message}</p>
                      {job.clarification?.kind === "choice" && (
                        <div className="look-presets">
                          {(job.clarification?.options || []).map((option) => (
                            <button
                              type="button"
                              key={option.id}
                              className={clarifyOption === option.id ? "selected" : ""}
                              onClick={() => setClarifyOption(option.id)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {job.clarification?.kind === "duration" && (
                        <Input
                          type="number"
                          min={1}
                          max={10800}
                          aria-label="Duration in seconds"
                          value={clarifyAnswer}
                          onChange={(e) => setClarifyAnswer(e.target.value)}
                        />
                      )}
                      {job.clarification?.kind === "topic" && (
                        <Input
                          aria-label="Clarify the topic"
                          value={clarifyAnswer}
                          onChange={(e) => setClarifyAnswer(e.target.value)}
                          placeholder="Answer in a sentence…"
                        />
                      )}
                      {job.clarification?.kind === "missing_asset" && (
                        <p className="subtle-note">Upload the file in Style & sound, then continue.</p>
                      )}
                      <Button
                        className="generate-button"
                        disabled={
                          (job.clarification?.kind === "choice" && !clarifyOption) ||
                          (job.clarification?.kind === "topic" && !clarifyAnswer.trim()) ||
                          (job.clarification?.kind === "duration" && !clarifyAnswer)
                        }
                        onClick={() =>
                          action(`/jobs/${job.id}/continue`, {
                            option: clarifyOption || undefined,
                            answer: clarifyAnswer || undefined,
                          })
                        }
                      >
                        Continue
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => action(`/jobs/${job.id}/cancel`, {})}
                      >
                        Dismiss — keep current edit
                      </Button>
                    </div>
                  </div>
                )}
                {selected?.edit_summary?.message && !viewSource && !showClarify && <p className="subtle-note">{selected.edit_summary.message}</p>}
                {!viewSource && selected?.stills ? (
                  <div className="diagnostic-stills">
                    {(["start", "mid", "end"] as const).map((at) => {
                      const url = selected.stills?.[at];
                      return url ? (
                        <img key={at} src={url} alt={`Diagnostic frame at ${at}`} />
                      ) : null;
                    })}
                  </div>
                ) : null}
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
                        if (revisionPrompt.trim())
                          action("/revisions", {
                            prompt: revisionPrompt,
                            base_revision: selected.id,
                          });
                      }}
                    >
                      <Input
                        aria-label="Describe an edit revision"
                        value={revisionPrompt}
                        onChange={(e) => setRevisionPrompt(e.target.value)}
                        placeholder="Tell us what to change…"
                        disabled={processing}
                      />
                      <Button
                        aria-label="Apply revision"
                        type="submit"
                        disabled={!revisionPrompt.trim() || processing}
                      >
                        <ArrowUp size={18} />
                      </Button>
                    </form>
                    <div className="prompt-suggestions">
                      {[
                        "Make captions larger",
                        "Make it vertical",
                        "Make it landscape",
                        "Remove captions",
                        "Less B-roll",
                        "Make the first 5 seconds faster",
                      ].map((s) => (
                        <button
                          key={s}
                          disabled={processing}
                          onClick={() =>
                            action("/revisions", {
                              prompt: s,
                              base_revision: selected.id,
                            })
                          }
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
                    {project.clip_search && <p className="subtle-note">{project.clip_search.message}</p>}
                    <p className="subtle-note">
                      Style selected moments as separate {aspect} clips, or combine them into one {aspect} reel.
                    </p>
                    <div className="clip-actions">
                      <Button
                        variant="outline"
                        disabled={processing || !chosenClips.some((id) => project.clips.some((c) => c.id === id))}
                        onClick={() =>
                          action("/clips/render", {
                            clips: chosenClips.filter((id) => project.clips.some((c) => c.id === id)),
                            aspect,
                          })
                        }
                      >
                        Style selected as separate {aspect} clips (
                        {chosenClips.filter((id) => project.clips.some((c) => c.id === id)).length})
                      </Button>
                      <Button
                        variant="outline"
                        disabled={processing || project.clips.length === 0}
                        onClick={() => {
                          const ids = chosenClips.filter((id) =>
                            project.clips.some((c) => c.id === id),
                          );
                          const payload = {
                            prompt: "Combine highlights into one video",
                            combine_reel: true,
                            aspect,
                            captions,
                            clips: ids.length ? ids : project.clips.map((c) => c.id),
                            reuse_clips: true,
                          };
                          if (selected)
                            action("/revisions", { ...payload, base_revision: selected.id });
                          else
                            action("/analyze", {
                              ...finishing,
                              ...payload,
                              clip_count: clipCount,
                              clip_min_seconds: clipMin,
                              clip_max_seconds: clipMax,
                            });
                        }}
                      >
                        Combine {chosenClips.some((id) => project.clips.some((c) => c.id === id)) ? "selected" : "all"} into one {aspect} reel
                      </Button>
                    </div>
                    {project.clips.map((c, i) => (
                      <article className="clip-candidate" key={c.id}>
                        <input type="checkbox" aria-label={`Select ${c.title}`} disabled={!!processing} checked={chosenClips.includes(c.id)} onChange={e => setChosenClips(ids => e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))} />
                        <span className="clip-rank">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{c.title}</h3>
                          {c.hook && <p className="clip-hook">“{c.hook}”</p>}
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
                          onClick={() => action("/clips/" + c.id, { aspect })}
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
                    {project.mode === "clips" && (
                      <div className="setting-group">
                        <label className="field-heading">Clipping output</label>
                        <div className="look-presets" role="radiogroup" aria-label="Clipping output">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={clipLayout === "separate"}
                            disabled={styleLocked}
                            className={clipLayout === "separate" ? "selected" : ""}
                            onClick={() => {
                              setClipLayout("separate");
                              setAspect("9:16");
                            }}
                          >
                            <strong>Separate clips</strong>
                            <span>Rank stand-alone highlights. You pick which ones to style. Starts in 9:16.</span>
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={clipLayout === "combined"}
                            disabled={styleLocked}
                            className={clipLayout === "combined" ? "selected" : ""}
                            onClick={() => {
                              setClipLayout("combined");
                              setAspect("16:9");
                            }}
                          >
                            <strong>One highlight reel</strong>
                            <span>Stitch the strongest moments into a single video. Starts in 16:9.</span>
                          </button>
                        </div>
                      </div>
                    )}
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
                        {project.mode === "clips"
                          ? clipLayout === "combined"
                            ? `One ${aspect} video of the ranked highlights, in source order.`
                            : `Separate ${aspect} clips. Change format if you want landscape shorts.`
                          : finishing.framing === "auto"
                          ? "Follow the subject, with a wider view when framing is uncertain."
                          : finishing.fit === "cover"
                          ? "Fill the frame. Adjust focus in Style & sound."
                          : "Full frame is preserved with letterboxing."}
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
                        <label htmlFor="captions">Captions</label>
                        <span>
                          {health?.ai_configured ||
                          project.analysis?.segments.length
                            ? "Clear words, timed to your voice."
                            : "Import subtitles or connect AI."}
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
                    {project.mode === "social" && (
                      <div className="setting-group">
                        <label className="field-heading">Talking-head look</label>
                        <div className="look-presets" role="radiogroup" aria-label="Talking-head look">
                          {lookPresets.map((look) => (
                            <button
                              type="button"
                              key={look.id}
                              disabled={styleLocked}
                              className={lookPreset === look.id ? "selected" : ""}
                              onClick={() => setLookPreset(look.id)}
                            >
                              <strong>{look.title}</strong>
                              <span>{look.detail}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {selected ? (
                      <details className="manual-edit" open>
                        <summary>
                          <SlidersHorizontal size={16} /> Style & sound
                        </summary>
                    <EditorFinishing
                      project={project}
                      value={finishing}
                      onChange={setFinishing}
                      disabled={styleLocked}
                      hasRevision={!!selected}
                      onReload={load}
                      onApply={() =>
                        selected &&
                        action("/revisions", {
                          plan: {
                            ...selected.plan,
                            ...finishing,
                            cuts: selected.plan.cuts,
                            aspect,
                            captions,
                          },
                          prompt: "Updated style and sound",
                        })
                      }
                    />
                    <EditorMedia project={project} plan={selected?.plan} disabled={styleLocked} onReload={load}
                      onApply={plan => action("/revisions", { plan, prompt: "Updated supporting media", base_revision: selected?.id })} />
                      </details>
                    ) : (
                      <p className="subtle-note">Finishing controls open after the first cut.</p>
                    )}
                    <div className="setting-group">
                      <label className="field-heading" htmlFor="edit-direction">What would you like to create?</label>
                      <Input id="edit-direction" value={prompt} maxLength={2000} onChange={e => setPrompt(e.target.value)}
                        placeholder={
                          project.mode === "clips"
                            ? clipLayout === "combined"
                              ? "The most important complete moments, combined into one reel"
                              : "Find the strongest stand-alone highlights from this stream"
                            : project.mode === "inspirational"
                              ? "Cinematic motivational cut. Keep the speech, captions on the key lines, music if I uploaded a track."
                              : project.mode === "social"
                                ? "Tight vertical talking-head from this raw take. Captions, dead air out, punch in on the strongest lines."
                                : "A concise product story with a strong opening"
                        } disabled={styleLocked} />
                      <p className="subtle-note">
                        {project.mode === "clips"
                          ? clipLayout === "combined"
                            ? "Frame ranks complete moments, then concatenates them into one captioned video at the format above."
                            : "Frame ranks complete moments. You choose which ones to style as separate clips at the format above."
                          : "Describe the result, length and tone. Raw footage is edited; captions stay on when speech is found."}
                      </p>
                      {!sourceReady && (
                        <p className="subtle-note" role="status">
                          {job?.kind === "ingest" && job?.status === "failed"
                            ? "Your file is uploaded, but it still needs to be prepared before Create first cut can run. Retry processing above."
                            : "Preparing the original video. You can set style and write a prompt now; Create first cut unlocks when preparation finishes."}
                        </p>
                      )}
                    </div>
                    {project.mode === "clips" && <div className="setting-group">
                      <label className="field-heading" htmlFor="clip-count">Number of highlights</label>
                      <Input id="clip-count" type="number" min={1} max={15} value={clipCount} onChange={e => setClipCount(Number(e.target.value))} />
                      <p className="subtle-note">
                        {clipLayout === "combined"
                          ? "How many complete moments to stitch into the reel."
                          : "How many stand-alone moments to rank. You choose which ones to style next."}
                      </p>
                      <div className="trim-inputs">
                        <label>Shortest moment (sec)<Input type="number" min={20} max={90} value={clipMin} onChange={e => setClipMin(Number(e.target.value))} /></label>
                        <label>Longest moment (sec)<Input type="number" min={clipMin} max={90} value={clipMax} onChange={e => setClipMax(Number(e.target.value))} /></label>
                      </div>
                    </div>}
                    <Button
                      className="generate-button"
                      disabled={
                        !sourceReady || processing ||
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
                        ? clipLayout === "combined"
                          ? "Create highlight reel"
                          : "Find highlights"
                        : selected
                          ? "Rebuild from original"
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
                        Set start and end in minutes and seconds. Original is {duration(project.info.duration)}.
                      </p>
                      <div className="trim-inputs">
                        <TimecodeField
                          label="Start"
                          value={trimStart}
                          min={0}
                          max={Math.max(0, project.info.duration - 0.1)}
                          disabled={!sourceReady || processing}
                          onChange={setTrimStart}
                        />
                        <TimecodeField
                          label="End"
                          value={trimEnd}
                          min={0.1}
                          max={project.info.duration}
                          disabled={!sourceReady || processing}
                          onChange={setTrimEnd}
                        />
                      </div>
                      <Button
                        variant="outline"
                        disabled={
                          !sourceReady || processing || trimEnd <= trimStart
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
                  <EditorTranscript
                    aiAvailable={!!health?.ai_configured}
                    key={project.transcript_id || "untranscribed"}
                    project={project}
                    selected={selected}
                    disabled={!!processing || !sourceReady}
                    onReload={load}
                    onSeek={(time) => {
                      pendingSeek.current = time;
                      setViewSource(true);
                      if (viewSource && video.current) {
                        video.current.currentTime = time;
                        pendingSeek.current = null;
                      }
                    }}
                    onCut={(segments) =>
                      action("/speech-cuts", {
                        segments,
                        revision: selected?.id,
                        transcript_id: project.transcript_id,
                      })
                    }
                  />
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
