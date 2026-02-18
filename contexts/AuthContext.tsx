"use client";

import { api } from "@/lib/api";
import { clearDemoBets } from "@/lib/demo-bets";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

export const DEMO_BALANCE = "5000";

export interface User {
  id: number;
  username: string;
  email: string;
  membership: string;
  balance: string;
  isDemo?: boolean;
}

/** Creates a new demo user (cached per session). Each call gets a unique id/email. */
export function createDemoUser(): User {
  const id = Date.now();
  return {
    id,
    username: "Demo User",
    email: `demo-${id}@demo.aiexch.in`,
    membership: "standard",
    balance: DEMO_BALANCE,
    isDemo: true,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
        const { data } = await api.get("/profile/me", {
          withCredentials: true,
        });
        if (data.loggedIn && data.user) {
          setUser(data.user);
          setIsLoggedIn(true);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("user");
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch {
        localStorage.removeItem("user");
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    if (!userData?.id || !userData?.email) {
      console.error("Invalid user data provided to login");
      return;
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = async () => {
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
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch {
      logout();
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
