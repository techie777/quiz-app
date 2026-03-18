"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { data: session, status } = useSession();
  const loaded = status !== "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user?.isAdmin;

  useEffect(() => {
    if (loaded) {
      console.log("[AdminProvider] Session status:", status, "IsAuthenticated:", isAuthenticated);
    }
  }, [loaded, status, isAuthenticated]);
  const adminUser = isAuthenticated
    ? {
        id: session.user.adminId,
        username: session.user.username,
        name: session.user.name,
        role: session.user.role,
        permissions: (function () {
          const raw = session.user.permissions;
          if (raw && typeof raw === "object") return raw;
          if (typeof raw !== "string" || !raw.trim()) return {};
          try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
          } catch {
            return {};
          }
        })(),
      }
    : null;

  const login = useCallback(async (username, password) => {
    const result = await signIn("admin-login", {
      redirect: false,
      username,
      password,
    });
    if (result?.ok) return { success: true };
    return { success: false, error: result?.error || "Invalid username or password" };
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return (
    <AdminContext.Provider
      value={{ isAuthenticated, loaded, status, adminUser, login, logout }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
