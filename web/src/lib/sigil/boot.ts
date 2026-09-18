import { captureUnhandled, init } from "./client";

/** No-op when VITE_SIGIL_* build args are unset (upstream-compatible). */
export function bootSigil(): void {
  const url = import.meta.env.VITE_SIGIL_UI_INGEST_URL;
  const seed = import.meta.env.VITE_SIGIL_UI_OBF_BYTES;
  const mask = Number(import.meta.env.VITE_SIGIL_UI_OBF_MASK || 0);
  if (!url || !seed) return;
  init({
    url,
    seed,
    mask,
    svc: "silo-web",
    pkg: "silo-server",
  });
  captureUnhandled();
}
