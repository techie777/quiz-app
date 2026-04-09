"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (data?.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(data.admin);
          setStatus("authenticated");
        } else {
          setIsAuthenticated(false);
          setAdminUser(null);
          setStatus("unauthenticated");
        }
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
        setAdminUser(null);
        setStatus("unauthenticated");
      } finally {
        if (!mounted) return;
        setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        return { success: false, error: data?.message || "Invalid username or password" };
      }
      setIsAuthenticated(true);
      setAdminUser(data.admin);
      setStatus("authenticated");
      return { success: true };
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    setAdminUser(null);
    setStatus("unauthenticated");
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
