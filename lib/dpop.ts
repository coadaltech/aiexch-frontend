// lib/dpop.ts
// ─── DPoP (Demonstrating Proof of Possession, RFC 9449) client helper ────────
//
// Holds a per-browser ECDSA P-256 key pair whose PRIVATE key is generated
// non-extractable and stored in IndexedDB. The private key can be USED to sign
// (crypto.subtle) but its raw bytes can never be read out — not by our code, not
// by an XSS payload, not by an extension. So even if an attacker steals the
// access/refresh token, they can't forge the per-request proof the backend now
// requires, and the token is useless from Postman or any other machine.
//
// Public API:
//   getDpopPublicJwk()           → the public JWK to send at login (binds tokens)
//   createDpopProof(method, url) → a one-shot proof JWT for a single request
//   clearDpopKey()               → drop the key (e.g. on hard logout)

import { SignJWT, exportJWK } from "jose";

const DB_NAME = "aiexch-auth";
const STORE = "dpop-keys";
const RECORD_ID = "keypair";

// In-memory cache so we don't hit IndexedDB on every request.
let cachedKeyPair: CryptoKeyPair | null = null;
let cachedPublicJwk: JsonWebKey | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = () => resolve(r.result as T | undefined);
        r.onerror = () => reject(r.error);
      }),
  );
}

function idbSet(key: string, val: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function idbDel(key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

/** Load the stored key pair, or generate + persist a fresh non-extractable one. */
async function getKeyPair(): Promise<CryptoKeyPair> {
  if (cachedKeyPair) return cachedKeyPair;

  // CryptoKey objects are structured-cloneable, so a non-extractable key pair
  // survives a round-trip through IndexedDB intact.
  const stored = await idbGet<CryptoKeyPair>(RECORD_ID).catch(() => undefined);
  if (stored?.privateKey && stored?.publicKey) {
    cachedKeyPair = stored;
    return stored;
  }

  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // ⬅️ private key is NON-EXTRACTABLE — cannot be exported, ever
    ["sign", "verify"],
  );
  await idbSet(RECORD_ID, keyPair).catch(() => {
    /* persistence failure is non-fatal — the in-memory key still works for now */
  });
  cachedKeyPair = keyPair;
  return keyPair;
}

/** The public JWK (kty/crv/x/y) — sent at login so the server binds the tokens. */
export async function getDpopPublicJwk(): Promise<JsonWebKey> {
  if (cachedPublicJwk) return cachedPublicJwk;
  const { publicKey } = await getKeyPair();
  // The public key of a generated pair is always exportable, even when the
  // private key is non-extractable.
  const jwk = await exportJWK(publicKey);
  cachedPublicJwk = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } as JsonWebKey;
  return cachedPublicJwk;
}

/**
 * Build a single-use DPoP proof JWT for one HTTP request. Bound to the method
 * and URL, freshly timestamped, with a unique jti so the server can reject any
 * replay. `url` should be the absolute request URL (the server compares only the
 * path, which is proxy-safe).
 */
export async function createDpopProof(method: string, url: string): Promise<string> {
  const { privateKey } = await getKeyPair();
  const publicJwk = await getDpopPublicJwk();
  return new SignJWT({
    htm: method.toUpperCase(),
    htu: url,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk: publicJwk as any })
    .setIssuedAt()
    .sign(privateKey);
}

/** Drop the key pair (e.g. on explicit logout). A new one is made on next use. */
export async function clearDpopKey(): Promise<void> {
  cachedKeyPair = null;
  cachedPublicJwk = null;
  await idbDel(RECORD_ID).catch(() => {});
}
