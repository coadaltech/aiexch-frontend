"use client";

import { api, clearTokens, proactiveRefresh, getAuthCookie } from "@/lib/api";
import { clearDemoBets } from "@/lib/demo-bets";
import { setUserCountry, setUserTimezone } from "@/lib/date-utils";
import { normalizeRole, normalizeMembership } from "@/types/enums";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export const DEMO_BALANCE = "5000";

export interface User {
  id: string;
  username: string;
  email: string;
  membership: string;
  balance: string;
  isDemo?: boolean;
  role?: string;
  upline?: string;
  downline?: string;
  groupId?: number | null;
  currencyId?: string | null;
  country?: string | null;
  timezone?: string | null;
}

const applyUserTimezone = (u: { country?: string | null; timezone?: string | null } | null | undefined) => {
  if (!u) return;
  if (u.timezone) setUserTimezone(u.timezone);
  else if (u.country) setUserCountry(u.country);
};

/** Creates a new demo user (cached per session). Each call gets a unique id/email. */
export function createDemoUser(): User {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}`;
  return {
    id,
    username: "Demo User",
    email: `demo-${id}@demo.aiexch.in`,
    membership: "standard",
    balance: DEMO_BALANCE,
    isDemo: true,
    role: "user",
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateDemoBalance: (newBalance: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Refresh access token 2 minutes before its 15-minute expiry
const PROACTIVE_REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks the session key this tab set so we can detect another tab logging in
  const sessionKeyRef = useRef<string | null>(null);

  // ── Proactive token refresh timer ─────────────────────────────────────────
  // Runs every 13 min to refresh the access token (expires at 15 min) so the
  // user is never silently logged out mid-session.
  const startRefreshTimer = () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      if (!getAuthCookie("refreshToken")) return; // nothing to refresh
      await proactiveRefresh();
    }, PROACTIVE_REFRESH_INTERVAL);
  };

  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  // Restore from sessionStorage immediately, then validate with backend
  useEffect(() => {
    // 1. Hydrate from sessionStorage (optimistic UI)
    const cachedUser = sessionStorage.getItem("user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as User;
        setUser(parsed);
        setIsLoggedIn(true);
        applyUserTimezone(parsed);
      } catch {
        sessionStorage.removeItem("user");
      }
    }

    // 2. Validate with backend (skip for demo users – they are cache-only)
    const initAuth = async () => {
      // Snapshot sessionStorage key at the START of the async call so we can
      // detect if login() was called while we were waiting (race condition fix).
      const cachedAtStart = sessionStorage.getItem("user");

      if (cachedAtStart) {
        try {
          const parsed = JSON.parse(cachedAtStart) as User;
          if (parsed.isDemo) {
            setUser(parsed);
            setIsLoggedIn(true);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      try {
        const { data } = await api.get("/profile/me", { withCredentials: true });
        if (data.loggedIn && data.user) {
          const u = {
            ...data.user,
            role: normalizeRole(data.user.role),
            membership: normalizeMembership(data.user.membership),
          };
          setUser(u);
          setIsLoggedIn(true);
          applyUserTimezone(u);
          sessionStorage.setItem("user", JSON.stringify(u));
          startRefreshTimer();
        } else {
          // Only clear if login() wasn't called while we were awaiting /profile/me
          if (sessionStorage.getItem("user") === cachedAtStart) {
            sessionStorage.removeItem("user");
            setUser(null);
            setIsLoggedIn(false);
          }
        }
      } catch (e: any) {
        // Only clear auth on actual auth failures (401/403).
        // Network errors, timeouts, 5xx keep the cached session alive.
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          // Only clear if login() wasn't called while we were awaiting /profile/me
          if (sessionStorage.getItem("user") === cachedAtStart) {
            sessionStorage.removeItem("user");
            setUser(null);
            setIsLoggedIn(false);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 3. Listen for session-expired events dispatched by the API interceptor
    //    (fires when a refresh attempt fails with 401/403 — i.e. session kicked).
    const handleSessionExpired = () => {
      setUser(null);
      setIsLoggedIn(false);
      router.push("/login");
    };
    window.addEventListener("auth-session-expired", handleSessionExpired);

    // 4. Re-validate session when the tab becomes visible again (e.g. user
    //    switches back to this tab after logging in elsewhere). A 401 from
    //    /profile/me means the session was invalidated server-side.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && sessionStorage.getItem("user")) {
        api.get("/profile/me", { withCredentials: true }).then(({ data }) => {
          if (data.loggedIn && data.user) {
            const u = {
              ...data.user,
              role: normalizeRole(data.user.role),
              membership: normalizeMembership(data.user.membership),
            };
            setUser(u);
            applyUserTimezone(u);
            sessionStorage.setItem("user", JSON.stringify(u));
          } else {
            clearTokens();
            sessionStorage.removeItem("user");
            setUser(null);
            setIsLoggedIn(false);
            router.push("/login");
          }
        }).catch((e: any) => {
          if (e?.response?.status === 401 || e?.response?.status === 403) {
            clearTokens();
            sessionStorage.removeItem("user");
            setUser(null);
            setIsLoggedIn(false);
            router.push("/login");
          }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Cross-tab single-device enforcement via localStorage storage event.
    // When another tab logs in it writes a new loginSessionKey; we detect that
    // and log this tab out immediately.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "loginSessionKey" && e.newValue && e.newValue !== sessionKeyRef.current) {
        // Another browser tab/window just logged in — invalidate this session.
        clearTokens();
        sessionStorage.removeItem("user");
        setUser(null);
        setIsLoggedIn(false);
        router.push("/login");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      stopRefreshTimer();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth-session-expired", handleSessionExpired);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const login = (userData: User) => {
    if (!userData?.id || !userData?.email) {
      console.error("Invalid user data provided to login");
      return;
    }
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    applyUserTimezone(userData);
    if (!userData.isDemo) {
      startRefreshTimer();
      // Write a unique key so other browser tabs detect this login and log out.
      const sessionKey = crypto.randomUUID();
      sessionKeyRef.current = sessionKey;
      localStorage.setItem("loginSessionKey", sessionKey);
    }
  };

  const logout = async () => {
    stopRefreshTimer();
    const isDemo = user?.isDemo;
    if (!isDemo) {
      try {
        await api.post("/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }
    } else {
      clearDemoBets();
    }
    clearTokens();
    sessionStorage.removeItem("user");
    localStorage.removeItem("loginSessionKey");
    sessionKeyRef.current = null;
    setUser(null);
    setIsLoggedIn(false);
    router.push("/");
  };

  const refreshUser = async () => {
    if (user?.isDemo) return;
    try {
      const { data } = await api.get("/profile/me", { withCredentials: true });
      if (data.loggedIn && data.user) {
        const u = {
          ...data.user,
          role: normalizeRole(data.user.role),
          membership: normalizeMembership(data.user.membership),
        };
        setUser(u);
        setIsLoggedIn(true);
        applyUserTimezone(u);
        sessionStorage.setItem("user", JSON.stringify(u));
      } else {
        logout();
      }
    } catch (e: any) {
      // Only logout on auth errors, not network failures
      const status = e?.response?.status;
      if (status === 401 || status === 403) logout();
    }
  };

  const updateDemoBalance = (newBalance: string) => {
    if (!user?.isDemo) return;
    const updated = { ...user, balance: newBalance };
    setUser(updated);
    sessionStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        login,
        logout,
        refreshUser,
        updateDemoBalance,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
