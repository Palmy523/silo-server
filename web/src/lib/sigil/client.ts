/**
 * Browser UI ingest (vendored @sigil/ui). Zero deps. Never throws into the host app.
 */
import { b64, deobfuscate, importSigner, signedMessage } from "./crypto";

export type Seed = readonly number[];

export type Loc = {
  svc?: string;
  pkg?: string;
  path?: string;
  error_class?: number;
  start?: number;
  end?: number;
};

export type Init = {
  url: string;
  seed: Seed | string;
  mask: number;
  svc?: string;
  pkg?: string;
  path?: string;
};

type Cfg = {
  url: string;
  seed: Seed;
  mask: number;
  svc: string;
  pkg: string;
  path: string;
};

let cfg: Cfg | null = null;
let keyp: Promise<CryptoKey> | null = null;

export function parseSeed(csv: string): number[] {
  const n = csv
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  if (n.length !== 64 || n.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return [];
  return n;
}

export function init(opts: Init): void {
  if (!opts?.url) return;
  const seed = typeof opts.seed === "string" ? parseSeed(opts.seed) : [...opts.seed];
  if (seed.length !== 64) return;
  cfg = {
    url: opts.url,
    seed,
    mask: opts.mask | 0,
    svc: opts.svc || "silo-web",
    pkg: opts.pkg || "silo-server",
    path: opts.path || "",
  };
  keyp = null;
}

export function emit(symbol: string, err: unknown, loc: Loc = {}): void {
  if (!cfg) return;
  try {
    const origin = typeof location !== "undefined" ? location.origin : "";
    if (!origin) return;
    const bodyStr = JSON.stringify({
      svc: loc.svc || cfg.svc,
      pkg: loc.pkg || cfg.pkg,
      path: loc.path || cfg.path || (typeof location !== "undefined" ? location.pathname : ""),
      symbol: String(symbol || "ui"),
      message: messageOf(err).slice(0, 128),
      error_class: loc.error_class || 3,
      start: loc.start || 1,
      end: loc.end || 40,
    });
    const body = new TextEncoder().encode(bodyStr);
    const ts = Date.now();
    const msg = signedMessage(origin, ts, body);
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return;
    const p = keyp || (keyp = importSigner(deobfuscate(cfg.seed, cfg.mask)));
    p.then((key) => subtle.sign("Ed25519", key, msg as BufferSource))
      .then((sig) => post(cfg!.url, ts, bodyStr, b64(new Uint8Array(sig))))
      .catch(() => {});
  } catch {
    /* never throw into the host app */
  }
}

export function wrap<T>(symbol: string, fn: () => T, loc?: Loc): T {
  try {
    return fn();
  } catch (e) {
    emit(symbol, e, loc);
    throw e;
  }
}

export async function wrapAsync<T>(symbol: string, fn: () => Promise<T>, loc?: Loc): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    emit(symbol, e, loc);
    throw e;
  }
}

export function captureUnhandled(): void {
  if (typeof addEventListener !== "function") return;
  addEventListener("error", (ev) => emit("unhandled", ev.message));
  addEventListener("unhandledrejection", (ev) => emit("unhandledRejection", ev.reason));
}

export const sigil = { init, emit, wrap, wrapAsync, captureUnhandled, parseSeed };

function messageOf(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name;
  return String(err);
}

function post(url: string, ts: number, body: string, sig: string): void {
  fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "x-sigil-ts": String(ts),
      "x-sigil-sig": sig,
    },
    body,
    keepalive: true,
  }).catch(() => {});
}
