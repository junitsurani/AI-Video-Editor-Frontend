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
  X,
  Search,
  CheckCircle2,
} from "lucide-react";
import { csrfHeaders, clearCsrf, redirectToLogin } from "@/lib/auth";
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
  duration,
  type Project,
  type Mode,
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
    load();
  }, []);
  useEffect(() => {
    const m = searchParams.get("mode");
    if (modes.some((x) => x.id === m)) {
      setMode(m as Mode);
      setModal(true);
    }
    setView(searchParams.get("view") === "projects" ? "projects" : "home");
  }, [searchParams]);
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
      const init = await api<{ id: string; chunk_size: number }>(
        "/uploads",
        "POST",
        { filename: file.name, size: file.size, mode },
      );
      for (
        let offset = 0, i = 0;
        offset < file.size;
        offset += init.chunk_size, i++
      ) {
        const chunk = file.slice(offset, offset + init.chunk_size);
        const chunkHeaders = await csrfHeaders();
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", `/api/uploads/${init.id}/chunks/${i}`);
          Object.entries(chunkHeaders).forEach(([key, value]) =>
            xhr.setRequestHeader(key, value),
          );
          xhr.upload.onprogress = (e) =>
            setProgress(
              Math.min(99, Math.round(((offset + e.loaded) / file.size) * 100)),
            );
          xhr.onload = () => {
            if (xhr.status === 401) {
              redirectToLogin();
              reject(new Error("Please sign in again."));
              return;
            }
            if (xhr.status === 403) clearCsrf();
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else {
              try {
                reject(new Error(JSON.parse(xhr.responseText).error));
              } catch {
                reject(new Error("Upload failed. Please retry."));
              }
            }
          };
          xhr.onerror = () =>
            reject(new Error("Connection lost. Please retry your upload."));
          xhr.send(chunk);
        });
      }
      const p = await api<Project>(`/uploads/${init.id}/complete`, "POST", {});
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
                <span>One upload. Four possibilities.</span>
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
                      {modes.find((m) => m.id === p.mode)?.title}
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
