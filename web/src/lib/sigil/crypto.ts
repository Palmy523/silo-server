/** XOR seed + signed-message bytes. Collector: sigil/crates/sigil-server/src/ui_ingest.rs */

const PREFIX = "sgl1-ui\n";

export function deobfuscate(seed: ArrayLike<number>, mask: number): Uint8Array {
  const out = new Uint8Array(64);
  const m0 = mask & 255;
  const m1 = (mask >>> 8) & 255;
  for (let i = 0; i < 64; i++) {
    const rot = ((m1 << (i & 7)) | (m1 >>> (8 - (i & 7)))) & 255;
    out[i] = (Number(seed[i]) ^ m0 ^ rot ^ ((i * 13 + 7) & 255)) & 255;
  }
  return out;
}

export function signedMessage(origin: string, ts: number, body: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  return concat([
    enc.encode(PREFIX),
    enc.encode(origin),
    enc.encode("\n"),
    enc.encode(String(ts)),
    enc.encode("\n"),
    body,
  ]);
}

export function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export function b64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function b64url(bytes: Uint8Array): string {
  return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function importSigner(raw: Uint8Array): Promise<CryptoKey> {
  const d = raw.subarray(0, 32);
  const x = raw.subarray(32, 64);
  return crypto.subtle.importKey(
    "jwk",
    { kty: "OKP", crv: "Ed25519", key_ops: ["sign"], ext: false, d: b64url(d), x: b64url(x) },
    { name: "Ed25519" },
    false,
    ["sign"],
  );
}
