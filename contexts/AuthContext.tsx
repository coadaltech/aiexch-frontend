"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  membership: string;
  balance: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
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

    // 2. Always validate with backend for up-to-date data
    const initAuth = async () => {
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

  const login = async (userData: User) => {
    if (!userData?.id || !userData?.email) {
      console.error("Invalid user data provided to login");
      return;
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);

    // Refresh user data to get latest balance
    setTimeout(() => {
      refreshUser();
    }, 100);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    router.push("/");
  };

  const refreshUser = async () => {
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

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, login, logout, refreshUser, isLoading }}
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
