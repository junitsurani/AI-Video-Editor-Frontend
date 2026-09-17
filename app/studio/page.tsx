"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Captions,
  Film,
  Scissors,
  BookOpen,
  FolderOpen,
  Check,
  LoaderCircle,
  FileVideo,
  Search,
  CheckCircle2,
} from "lucide-react";
import { uploadVideo } from "@/lib/uploads";
import { demoMode } from "@/lib/demo";
import { StudioShell } from "@/components/studio-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  api,
  modes,
  laterModes,
  lookPresets,
  duration,
  type Project,
  type Mode,
  type LookPreset,
  type Health,
} from "@/lib/studio";
const icons = [Captions, Film, Scissors, BookOpen];
export default function Studio() {
  return (
    <Suspense
      fallback={
        <StudioShell>
          <div className="empty-projects">Opening your workspace…</div>
        </StudioShell>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [mode, setMode] = useState<Mode>("social");
  const [lookPreset, setLookPreset] = useState<LookPreset>("simple");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [drag, setDrag] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("home");
  const input = useRef<HTMLInputElement>(null);
  async function load() {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        api<{ projects: Project[] }>("/projects"),
        api<Health>("/health"),
      ]);
      setProjects(p.projects);
      setHealth(h);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    Promise.all([api<{ projects: Project[] }>("/projects"), api<Health>("/health")])
      .then(([p, h]) => { if (active) { setProjects(p.projects); setHealth(h); setError(""); } })
      .catch((e) => { if (active) setError((e as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const [route, setRoute] = useState<string | null>(null);
  if (route !== searchParams.toString()) {
    setRoute(searchParams.toString());
    const m = searchParams.get("mode");
    if (modes.some((x) => x.id === m)) {
      setMode(m as Mode);
      setModal(true);
    }
    setView(searchParams.get("view") === "projects" ? "projects" : "home");
  }
  function choose(m: Mode) {
    setMode(m);
    setUploadError("");
    setModal(true);
  }
  function pick(f: File | undefined) {
    if (!f) return;
    setUploadError("");
    if (!/\.(mp4|mov)$/i.test(f.name)) {
      setUploadError("Choose an MP4 or MOV video.");
      return;
    }
    if (f.size > (health?.max_upload_bytes || 2147483648)) {
      setUploadError("Please choose a video smaller than 2 GB.");
      return;
    }
    setFile(f);
  }
  async function upload() {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    setProgress(0);
    try {
      const p = await uploadVideo(file, mode, setProgress, mode === "social" ? lookPreset : undefined);
      setProgress(100);
      router.push("/studio/project/" + p.id);
    } catch (e) {
      setUploadError((e as Error).message);
      setUploading(false);
    }
  }
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <StudioShell section={view === "projects" ? "Projects" : "Workspace"}>
      <main className="workspace">
        <div className="workspace-title">
          <div>
            <span className="workspace-eyebrow">YOUR CREATIVE SPACE</span>
            <h1>
              {view === "projects"
                ? "Your projects"
                : "Good stories start here."}
            </h1>
            <p>
              {view === "projects"
                ? "Every idea, first cut, and final frame."
                : "Bring your footage. We’ll help you find its best version."}
            </p>
          </div>
          <Button onClick={() => choose("social")} className="new-project">
            <Plus size={17} /> New project
          </Button>
        </div>
        {view !== "projects" && (
          <>
            <section
              className={"upload-zone " + (drag ? "dragging" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pick(e.dataTransfer.files[0]);
                setModal(true);
              }}
            >
              <div className="upload-symbol">
                <Upload size={25} />
              </div>
              <h2>A new story starts with your footage</h2>
              <p>Drop your video here, or browse your files.</p>
              <Button
                onClick={() => {
                  setModal(true);
                  setUploadError("");
                }}
                className="upload-button"
              >
                Upload a video <ArrowUpRight size={16} />
              </Button>
              <span>
                MP4 or MOV <b>·</b> Up to 2 GB <b>·</b> Your original stays
                untouched
              </span>
            </section>
            <section className="edit-workflows">
              <div className="workspace-section-heading">
                <h2>What are we creating?</h2>
                <span>One upload. Three complete workflows.</span>
              </div>
              <div className="studio-workflows">
                {modes.map((m, i) => {
                  const Icon = icons[i];
                  return (
                    <button
                      className={"studio-mode mode-" + i}
                      key={m.id}
                      onClick={() => choose(m.id)}
                    >
                      <div className="mode-picture">
                        <Image
                          src={m.image}
                          alt=""
                          fill
                          sizes="(max-width: 700px) 45vw, 23vw"
                        />
                        <span className="mode-icon">
                          <Icon size={17} />
                        </span>
                      </div>
                      <div className="mode-text">
                        <h3>
                          {m.title}
                          <ArrowUpRight size={16} />
                        </h3>
                        <p>{m.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
        <section className="project-section" id="projects">
          <div className="workspace-section-heading">
            <h2>
              {view === "projects" ? "All projects" : "Recent projects"}{" "}
              <span className="count">{projects.length}</span>
            </h2>
            <div className="project-controls">
              {projects.length > 0 && (
                <label className="search-input">
                  <Search size={15} />
                  <Input
                    aria-label="Search projects"
                    placeholder="Search projects"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
              {view !== "projects" && projects.length > 3 && (
                <button onClick={() => setView("projects")}>
                  View all <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
          {error ? (
            <div className="empty-projects">
              <FolderOpen size={28} />
              <h3>Let’s reconnect your workspace</h3>
              <p role="alert">{error}</p>
              <Button variant="outline" onClick={load}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="empty-projects">
              <LoaderCircle className="spin" />
              <p>Loading your projects…</p>
            </div>
          ) : filtered.length ? (
            <div className="project-grid">
              {filtered
                .slice(0, view === "projects" ? undefined : 6)
                .map((p) => (
                  <Link
                    key={p.id}
                    className="project-card"
                    href={"/studio/project/" + p.id}
                  >
                    <div className="project-card-heading">
                      <Film size={14} aria-hidden="true" />
                      <h3 title={p.name}>{p.name}</h3>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </div>
                    <div
                      className="project-thumb"
                      style={{ backgroundImage: `url('${p.thumbnail_url}')` }}
                    >
                      <span>{duration(p.info.duration)}</span>
                      <span className="project-status">
                        {p.job?.status === "running"
                          ? "Processing"
                          : p.status === "ready"
                            ? "Ready to review"
                            : p.status === "clips_ready"
                              ? "Clips ready"
                              : "Original uploaded"}
                      </span>
                    </div>
                    <p>
                      {modes.find((m) => m.id === p.mode)?.title || laterModes.find((m) => m.id === p.mode)?.title}
                      <span>
                        {new Date(p.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  </Link>
                ))}
            </div>
          ) : (
            <div className="empty-projects">
              <div className="empty-icon">
                <FolderOpen size={24} />
              </div>
              <h3>
                {query
                  ? "No matching projects"
                  : "Room for your next great idea"}
              </h3>
              <p>
                {query
                  ? "Try another project name."
                  : "Your projects will live here. Start with a video and make it yours."}
              </p>
              {!query && (
                <button className="text-link" onClick={() => choose("social")}>
                  Create your first project <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </section>
        <div className="workspace-footer">
          <span>
            <CheckCircle2 size={14} /> Originals preserved. Every edit
            reversible.
          </span>
          <span>Made for your next great story.</span>
        </div>
      </main>
      <Dialog
        open={modal}
        onOpenChange={(v) => {
          if (!uploading) {
            setModal(v);
            setUploadError("");
          }
        }}
      >
        <DialogContent className="upload-dialog" showCloseButton={!uploading}>
          <DialogTitle>Start a new project</DialogTitle>
          <DialogDescription>
            {demoMode
              ? "Explore the editing options. Uploads will be available when the backend is reconnected."
              : "Bring your footage and choose where to take it."}
          </DialogDescription>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept=".mp4,.mov,video/mp4,video/quicktime"
            aria-label="Choose video file"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button
            disabled={uploading}
            className={"modal-drop " + (file ? "has-file" : "")}
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!uploading) pick(e.dataTransfer.files[0]);
            }}
          >
            {file ? (
              <>
                <FileVideo size={28} />
                <strong>{file.name}</strong>
                <span>
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
                </span>
              </>
            ) : (
              <>
                <Upload size={27} />
                <strong>Choose a video or drop it here</strong>
                <span>MP4 or MOV · Up to 2 GB</span>
              </>
            )}
          </button>
          <label className="field-heading">What kind of edit?</label>
          <div className="modal-modes">
            {modes.map((m, i) => {
              const Icon = icons[i];
              return (
                <button
                  disabled={uploading}
                  key={m.id}
                  className={mode === m.id ? "selected" : ""}
                  onClick={() => setMode(m.id)}
                >
                  <Icon size={17} />
                  {m.title}
                  {mode === m.id && <Check size={14} />}
                </button>
              );
            })}
          </div>
          {mode === "social" && (
            <>
              <label className="field-heading">Talking-head look</label>
              <div className="look-presets" role="radiogroup" aria-label="Talking-head look">
                {lookPresets.map((look) => (
                  <button
                    type="button"
                    key={look.id}
                    disabled={uploading}
                    className={lookPreset === look.id ? "selected" : ""}
                    onClick={() => setLookPreset(look.id)}
                  >
                    <strong>{look.title}</strong>
                    <span>{look.detail}</span>
                    {lookPreset === look.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
          {mode === "clips" && (
            <p className="privacy-note">
              Clipping is meant for long-form footage. A short talking-head take can still be ranked, but the job is finding shareable moments inside a finished episode or vlog.
            </p>
          )}
          <p className="privacy-note">{laterModes[0].title} is coming later.</p>
          {uploading && (
            <div className="upload-progress" aria-live="polite">
              <div>
                <span>
                  {progress < 100
                    ? "Uploading your original…"
                    : "Opening your project…"}
                </span>
                <strong>{progress}%</strong>
              </div>
              <progress value={progress} max={100} />
            </div>
          )}
          {uploadError && (
            <p className="error-message" role="alert">
              {uploadError}
            </p>
          )}
          <Button
            className="modal-submit"
            disabled={demoMode || !file || uploading}
            onClick={upload}
          >
            {uploading ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Plus size={17} />
            )}{" "}
            {uploading ? "Creating your project" : "Create project"}
          </Button>
          <p className="privacy-note">
            {demoMode
              ? "Dashboard demo · No files are uploaded."
              : "Your footage is saved in your workspace. Your original is never overwritten."}
          </p>
        </DialogContent>
      </Dialog>
    </StudioShell>
  );
}
