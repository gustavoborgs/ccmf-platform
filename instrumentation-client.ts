import posthog from "posthog-js/dist/module.full.no-external";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: false,
  disable_external_dependency_loading: true,
  disable_session_recording: false,
  debug: process.env.NODE_ENV === "development",
  loaded: (ph) => {
    ph.startSessionRecording(true);
  },
});
