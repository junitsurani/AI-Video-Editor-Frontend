import { clearCsrf, csrfHeaders, redirectToLogin } from "./auth";
import { demoMode } from "./demo";
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
  caption_position?: "lower" | "center";
  denoise?: boolean;
  music_id?: string | null;
  music_volume?: number;
  music_duck?: boolean;
  fade?: number;
  normalize_audio: boolean;
};
export type Plan = Finishing & {
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
};
export type Job = {
  id: string;
  kind: string;
  status: string;
  progress: number;
  message: string;
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
    title: "Social edit",
    description: "Talking heads that stop the scroll.",
    detail: "Captions, tighter pacing, and vertical framing.",
    image: "/workflows/social.webp",
    label: "REELS · SHORTS · TIKTOK",
  },
  {
    id: "inspirational" as Mode,
    title: "Cinematic edit",
    description: "Turn a moment into a feeling.",
    detail: "Cinematic contrast and an intentional pace.",
    image: "/workflows/cinematic.webp",
    label: "MOTIVATION · MOVIE EDITS",
  },
  {
    id: "clips" as Mode,
    title: "Long-form to clips",
    description: "Find the moments worth sharing.",
    detail: "Review ranked highlights before you style them.",
    image: "/workflows/clips.webp",
    label: "PODCASTS · INTERVIEWS",
  },
  {
    id: "course" as Mode,
    title: "Courses & YouTube",
    description: "Clear ideas. Clean delivery.",
    detail: "Remove pauses and polish your lesson.",
    image: "/workflows/course.webp",
    label: "LESSONS · TUTORIALS · VLOGS",
  },
];
export function duration(n: number) {
  const s = Math.floor(n);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
