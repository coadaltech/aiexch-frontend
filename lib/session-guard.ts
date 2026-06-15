// lib/session-guard.ts
// ─── Client-side session lifecycle (idle timeout + logout-on-browser-close) ──
//
// Two guarantees, both enforced WITHOUT any backend polling or heartbeat
// requests — purely local timers + `localStorage` timestamps + a cross-tab
// BroadcastChannel handshake. Backend load is unchanged (zero extra calls),
// so this scales to any number of users.
//
//   1. Idle logout: if the user does nothing for IDLE_LIMIT_MS (1 hour), the
//      session is dropped. Activity in ANY tab resets the clock for ALL tabs.
//
//   2. Logout on close: when the whole browser (every tab) is closed and later
//      reopened — including via the browser's "restore tabs / continue where
//      you left off" feature, which silently restores cookies + sessionStorage
//      — the restored session is NOT trusted and the user is logged out.
//
// How close-detection works: while open, each tab stamps a `heartbeat` into
// localStorage (cheap, local). On load we decide:
//   • heartbeat fresh (< CLOSE_GRACE_MS)        → a tab was alive a moment ago
//                                                  → this is a reload → keep.
//   • heartbeat stale, but a peer tab answers a
//     BroadcastChannel ping                     → multi-tab session → keep.
//   • heartbeat stale, no peer answers          → every tab was closed → logout.
// The handshake is what makes multi-tab safe: opening a 2nd tab (or reloading
// one of several) never logs anyone out, because a live tab always answers.

const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 hour of no user activity → logout
const CLOSE_GRACE_MS = 30 * 1000; // gap after last heartbeat that means "browser was closed"
const HEARTBEAT_MS = 10 * 1000; // local-only liveness stamp (crash safety net)
const HANDSHAKE_TIMEOUT_MS = 400; // how long to wait for a peer tab to answer
const ACTIVITY_THROTTLE_MS = 30 * 1000; // cap localStorage writes from activity

const LAST_ACTIVITY_KEY = "session:lastActivityAt";
const HEARTBEAT_KEY = "session:heartbeat";
const CHANNEL = "aiexch:session-guard";

export const IDLE_LIMIT = IDLE_LIMIT_MS;

const readNum = (key: string): number => {
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

/**
 * Synchronous, cheap check used to decide whether to optimistically hydrate the
 * UI from sessionStorage before the async load resolution runs. Returns true
 * only when we're certain the session is live (a tab was alive moments ago and
 * the idle window hasn't elapsed) — so a reload hydrates instantly, while a
 * restored-after-close session shows nothing until `resolveOnLoad` confirms it.
 */
export function isClearlyLive(): boolean {
  if (typeof window === "undefined") return false;
  const la = readNum(LAST_ACTIVITY_KEY);
  const hb = readNum(HEARTBEAT_KEY);
  const now = Date.now();
  if (la > 0 && now - la > IDLE_LIMIT_MS) return false; // idle-expired
  return hb > 0 && now - hb <= CLOSE_GRACE_MS; // a tab was alive just now
}

/** True if the persisted session has been idle past the limit. */
export function isIdleExpired(): boolean {
  if (typeof window === "undefined") return false;
  const la = readNum(LAST_ACTIVITY_KEY);
  return la > 0 && Date.now() - la > IDLE_LIMIT_MS;
}

/** Ask other open tabs to identify themselves. Resolves true if any answers. */
function pingPeers(): Promise<boolean> {
  return new Promise((resolve) => {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(CHANNEL);
    } catch {
      resolve(false); // no BroadcastChannel support → assume no peer
      return;
    }
    const nonce = `${Date.now()}-${Math.random()}`;
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      try {
        bc.close();
      } catch {
        /* ignore */
      }
      resolve(v);
    };
    bc.onmessage = (e) => {
      if (e.data?.type === "alive" && e.data?.replyTo === nonce) finish(true);
    };
    try {
      bc.postMessage({ type: "who-is-alive", nonce });
    } catch {
      finish(false);
      return;
    }
    setTimeout(() => finish(false), HANDSHAKE_TIMEOUT_MS);
  });
}

export type LoadState = "ok" | "idle" | "closed";

/**
 * Decide, on app load, whether a persisted session may be restored.
 *  - "idle"   → untouched for ≥ 1h, drop it.
 *  - "closed" → browser was fully closed (no peer tab, stale heartbeat), drop it.
 *  - "ok"     → genuine reload or live multi-tab session, keep it.
 */
export async function resolveOnLoad(): Promise<LoadState> {
  if (typeof window === "undefined") return "ok";
  const la = readNum(LAST_ACTIVITY_KEY);
  const hb = readNum(HEARTBEAT_KEY);
  const now = Date.now();

  // Idle wins outright — an hour untouched is gone no matter what.
  if (la > 0 && now - la > IDLE_LIMIT_MS) return "idle";
  // No prior session marks → nothing to guard; let normal auth proceed.
  if (hb === 0 && la === 0) return "ok";
  // A tab stamped the heartbeat moments ago → single-tab reload → keep.
  if (hb > 0 && now - hb <= CLOSE_GRACE_MS) return "ok";
  // Stale heartbeat: either every tab closed, or peers are open but quiet.
  return (await pingPeers()) ? "ok" : "closed";
}

/**
 * Start the running guard for a logged-in session. Stamps activity/heartbeat,
 * tracks user input to reset the idle clock, answers peer pings, and fires
 * `onIdle` after IDLE_LIMIT_MS of inactivity (across all tabs).
 * Returns a cleanup function; call it on logout.
 */
export function startGuard(onIdle: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let lastWrite = 0;
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
  } catch {
    bc = null;
  }

  const stampHeartbeat = () => localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));

  const scheduleIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    const la = readNum(LAST_ACTIVITY_KEY) || Date.now();
    const fireIn = Math.max(0, la + IDLE_LIMIT_MS - Date.now());
    idleTimer = setTimeout(() => {
      // Re-check against the shared timestamp: another tab may have seen
      // activity (and pushed the deadline out) while our timer was pending.
      if (Date.now() - readNum(LAST_ACTIVITY_KEY) >= IDLE_LIMIT_MS) onIdle();
      else scheduleIdle();
    }, fireIn);
  };

  const onActivity = () => {
    const t = Date.now();
    if (t - lastWrite < ACTIVITY_THROTTLE_MS) return; // throttle writes
    lastWrite = t;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(t));
    scheduleIdle();
  };

  // Seed marks for this session and arm the timers.
  const start = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, String(start));
  lastWrite = start;
  stampHeartbeat();
  scheduleIdle();
  const hbTimer = setInterval(stampHeartbeat, HEARTBEAT_MS);

  const activityEvents = [
    "pointerdown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
    "mousemove",
    "wheel",
  ];
  activityEvents.forEach((ev) =>
    window.addEventListener(ev, onActivity, { passive: true }),
  );

  const onVisible = () => {
    if (document.visibilityState === "visible") stampHeartbeat();
  };
  document.addEventListener("visibilitychange", onVisible);

  // Stamp right before unload so a genuine reload shows a ~0 gap (stays logged
  // in) while a real close leaves the heartbeat frozen at close-time.
  const onPageHide = () => stampHeartbeat();
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);

  // Activity in another tab pushes the idle deadline; reschedule to match.
  const onStorage = (e: StorageEvent) => {
    if (e.key === LAST_ACTIVITY_KEY) scheduleIdle();
  };
  window.addEventListener("storage", onStorage);

  // Answer a newly-opened tab's "anyone alive?" handshake.
  if (bc) {
    bc.onmessage = (e) => {
      if (e.data?.type === "who-is-alive") {
        try {
          bc!.postMessage({ type: "alive", replyTo: e.data.nonce });
        } catch {
          /* ignore */
        }
      }
    };
  }

  return () => {
    if (idleTimer) clearTimeout(idleTimer);
    clearInterval(hbTimer);
    activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("beforeunload", onPageHide);
    window.removeEventListener("storage", onStorage);
    try {
      bc?.close();
    } catch {
      /* ignore */
    }
  };
}

/** Wipe session marks. Call on any logout so the next load starts clean. */
export function clearSessionMarks() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(HEARTBEAT_KEY);
}
