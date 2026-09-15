// Demo access must be explicitly enabled; production defaults to real auth.
export const demoMode = process.env.NEXT_PUBLIC_FRAME_DEMO_MODE === "true";
export const demoCookie = "frame_ui_demo";
export const demoUser = {
  id: "frontend-demo",
  name: "Frame Demo",
  email: "demo@frame.test",
  created_at: "2026-09-14T00:00:00Z",
};
