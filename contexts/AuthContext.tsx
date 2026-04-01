"use client";

import { api, clearTokens, proactiveRefresh, getAuthCookie } from "@/lib/api";
import { clearDemoBets } from "@/lib/demo-bets";
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
}

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

  // Restore from localStorage immediately, then validate with backend
  useEffect(() => {
    // 1. Hydrate from localStorage (optimistic UI)
    const cachedUser = localStorage.getItem("user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as User;
        setUser(parsed);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem("user");
      }
    }

    // 2. Validate with backend (skip for demo users – they are cache-only)
    const initAuth = async () => {
      const cached = localStorage.getItem("user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as User;
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
          localStorage.setItem("user", JSON.stringify(u));
          startRefreshTimer();
        } else {
          // Explicit "not logged in" response from backend — clear auth
          localStorage.removeItem("user");
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (e: any) {
        // Only clear auth on actual auth failures (401/403).
        // Network errors, timeouts, 5xx keep the cached session alive
        // so a brief backend outage doesn't log everyone out.
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("user");
          setUser(null);
          setIsLoggedIn(false);
        }
        // For any other error: leave the cached user intact
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => stopRefreshTimer();
  }, []);

  const login = (userData: User) => {
    if (!userData?.id || !userData?.email) {
      console.error("Invalid user data provided to login");
      return;
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    if (!userData.isDemo) startRefreshTimer();
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
    localStorage.removeItem("user");
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
        localStorage.setItem("user", JSON.stringify(u));
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
    localStorage.setItem("user", JSON.stringify(updated));
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
