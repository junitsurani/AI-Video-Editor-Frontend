import { clearCsrf, csrfHeaders, redirectToLogin } from "./auth";
import { demoMode } from "./demo";
export type LookPreset = "simple" | "retention" | "premium";
export type Mode = "social" | "inspirational" | "clips" | "course";
export type Finishing = {
  framing?: "auto" | "manual";
  subject_id?: string | null;
  look: "natural" | "cinematic" | "warm" | "mono";
  fit: "contain" | "cover";
  focus_x?: number;
  focus_y?: number;
  motion?: "none" | "push" | "punch";
  caption_style?: "clean" | "highlight" | "bold";
  caption_position?: "lower" | "center" | "behind";
  denoise?: boolean;
  music_id?: string | null;
  music_volume?: number;
  music_duck?: boolean;
  fade?: number;
  normalize_audio: boolean;
  look_preset?: LookPreset | null;
  punch_gain?: number;
  vignette?: boolean;
  music_rise_at?: number | null;
  caption_scale?: number;
};
export type SupportingAsset = {
  id: string; name: string; role: "broll" | "sfx" | "reference" | "music"; kind: "image" | "video" | "audio";
  duration: number; description: string; rights: string; status: string;
};
export type MediaLayer = { asset_id: string; start: number; end: number; source_start: number; layout?: "cover" | "split"; volume?: number };
export type GraphicLayer = { text: string; start: number; end: number; position: "top" | "center" | "behind" };
export type Plan = Finishing & {
  broll?: MediaLayer[];
  sfx?: MediaLayer[];
  graphics?: GraphicLayer[];
  transition?: "cut" | "dip";
  version?: number;
  beats?: number[];
  caption_emphasis?: string[];
  cuts: { start: number; end: number }[];
  aspect: "16:9" | "9:16";
  captions: boolean;
};
export type Revision = {
  id: string;
  created_at: string;
  prompt: string;
  plan: Plan;
  preview_url: string;
  export_url?: string;
  stills?: { start?: string; mid?: string; end?: string };
  edit_summary?: { message: string; changed_fields: string[]; quality?: { pass?: boolean; issues?: string[] }; behind_requested?: boolean; behind_applied?: boolean; fonts?: { role: string; family: string }[] } | null;
};
export type Job = {
  id: string;
  kind: string;
  status: string;
  progress: number;
  message: string;
  clarification?: {
    question: string;
    kind: "choice" | "missing_asset" | "duration" | "topic";
    options: { id: string; label: string }[];
  };
};
export type Project = {
  cleanup?: {
    id: string;
    transcript_id: string;
    created_at: string;
    suggestions: {
      id: string;
      kind: "retake" | "filler";
      start: number;
      end: number;
      text: string;
      reason: string;
      keep: { start: number; end: number; text: string } | null;
    }[];
  };
  id: string;
  name: string;
  filename: string;
  mode: Mode;
  look_preset?: LookPreset | null;
  size: number;
  status: string;
  created_at: string;
  updated_at: string;
  source_url: string;
  thumbnail_url: string;
  info: { duration: number; width: number; height: number; has_audio: boolean };
  job: Job | null;
  revisions: Revision[];
  clips: {
    id: string;
    title: string;
    start: number;
    end: number;
    hook: string;
    reason: string;
    score: number;
  }[];
  assets?: SupportingAsset[];
  clip_search?: { requested: number; returned: number; message: string };
  clip_options?: { aspect?: "9:16" | "16:9"; combine_reel?: boolean };
  music?: { id: string; name: string; duration: number }[];
  transcript_id?: string;
  analysis?: {
    segments: { start: number; end: number; text: string }[];
    words: { start: number; end: number; word: string }[];
    tracking?: { engine: string; subjects: string[] };
    scenes: number[];
    silences: number[][];
    transcript_status: string;
  };
};
export type Health = {
  worker_ready?: boolean;
  ai_configured: boolean;
  renderer: boolean;
  storage: string;
  max_upload_bytes: number;
};
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  if (demoMode) {
    if (method === "GET" && path === "/projects") return { projects: [] } as T;
    if (method === "GET" && path === "/health")
      return {
        ai_configured: false,
        renderer: false,
        storage: "demo",
        max_upload_bytes: 2147483648,
      } as T;
    throw new Error(
      "Uploads and editing are available when the backend is reconnected. You’re currently in the dashboard demo.",
    );
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch("/api" + path, {
      method,
      headers: {
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...(!["GET", "HEAD"].includes(method) ? await csrfHeaders() : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      cache: "no-store",
      credentials: "same-origin",
    });
    if (r.status === 401) {
      redirectToLogin();
      throw new Error("Please sign in again.");
    }
    let result;
    try {
      result = await r.json();
    } catch {
      throw new Error("The studio backend is unavailable. Please try again.");
    }
    if (result.code === "csrf_invalid" && attempt === 0) {
      clearCsrf();
      continue;
    }
    if (!r.ok)
      throw new Error(
        result.error || "Something went wrong. Please try again.",
      );
    return result as T;
  }
  throw new Error("Your session changed. Please retry.");
}
export const modes = [
  {
    id: "social" as Mode,
    title: "Talking head",
    description: "Raw takes into a watchable short.",
    detail: "Silence out, cream captions in your fonts, punch-ins, optional captions behind the speaker.",
    image: "/workflows/social.webp",
    label: "REELS · SHORTS · TIKTOK",
  },
  {
    id: "inspirational" as Mode,
    title: "Motivational",
    description: "Hook, build, payoff.",
    detail: "Keep the speech. Duck music, then rise after the key line.",
    image: "/workflows/cinematic.webp",
    label: "SPEECH · MUSIC · CUTAWAYS",
  },
  {
    id: "clips" as Mode,
    title: "Clipping",
    description: "Highlights from a finished long video.",
    detail: "Built for vlogs, podcasts, streams, and interviews. Rank 20–90s moments, then style or combine them.",
    image: "/workflows/clips.webp",
    label: "VLOGS · PODCASTS · STREAMS",
  },
];
export const laterModes = [
  {
    id: "course" as Mode,
    title: "Courses & YouTube",
    description: "Clear ideas. Clean delivery.",
    detail: "Dual-source course cleanup comes later.",
    image: "/workflows/course.webp",
    label: "COMING LATER",
  },
];
export const lookPresets = [
  { id: "simple" as LookPreset, title: "Simple", detail: "Nunito lower captions, Oswald on key words, light punch-ins." },
  { id: "retention" as LookPreset, title: "Retention", detail: "Anton captions behind the speaker, denser punch-ins. Switch to Normal anytime." },
  { id: "premium" as LookPreset, title: "Premium", detail: "Playfair lower captions, slow zoom-in, fade, catalog B-roll." },
];
export function duration(n: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = String(s % 60).padStart(2, "0");
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
  return `${minutes}:${seconds}`;
}
