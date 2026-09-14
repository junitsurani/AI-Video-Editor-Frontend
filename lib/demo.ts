// Temporary UI testing mode. Set NEXT_PUBLIC_FRAME_DEMO_MODE=false and rebuild
// to restore Flask authentication and project requests.
export const demoMode = process.env.NEXT_PUBLIC_FRAME_DEMO_MODE !== "false";
export const demoCookie = "frame_ui_demo";
export const demoUser = {
  id: "frontend-demo",
  name: "Frame Demo",
  email: "demo@frame.test",
  created_at: "2026-09-14T00:00:00Z",
};
