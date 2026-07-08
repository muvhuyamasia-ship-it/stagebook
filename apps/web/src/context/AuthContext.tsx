import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  ResetPasswordPayload
} from "../types";
import { clearSession, loadSession, storeSession } from "../lib/session";
import { getJson, postJson } from "../lib/api";

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  ready: boolean;
  loading: boolean;
  error: string | null;
  login: (input: { email: string; password: string }) => Promise<AuthSession>;
  signup: (input: { email: string; password: string; displayName: string }) => Promise<AuthSession>;
  forgotPassword: (input: ForgotPasswordPayload) => Promise<ForgotPasswordResult>;
  resetPassword: (input: ResetPasswordPayload) => Promise<string>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractUser(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "user" in payload) {
    return (payload as { user: AuthUser }).user;
  }

  return payload as AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSession();
    if (!stored) {
      setReady(true);
      return;
    }

    setSession(stored);
    getJson<unknown>("/api/auth/me", stored)
      .then((response) => {
        const nextSession = { ...stored, user: extractUser(response) };
        setSession(nextSession);
        storeSession(nextSession);
      })
      .catch(() => {
        clearSession();
        setSession(null);
      })
      .finally(() => setReady(true));
  }, []);

  async function persistAuth(response: AuthSession) {
    setSession(response);
    storeSession(response);
    setError(null);
  }

  async function login(input: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    try {
      const response = await postJson<AuthSession>("/api/auth/login", input);
      await persistAuth(response);
      return response;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
      throw cause;
    } finally {
      setLoading(false);
    }
  }

  async function signup(input: { email: string; password: string; displayName: string }) {
    setLoading(true);
    setError(null);
    try {
      const response = await postJson<AuthSession>("/api/auth/signup", {
        ...input,
        role: "client"
      });
      await persistAuth(response);
      return response;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account.");
      throw cause;
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword(input: ForgotPasswordPayload) {
    const response = await postJson<ForgotPasswordResult>(
      "/api/auth/forgot-password",
      input
    );
    return {
      message: response.message ?? "Reset instructions sent.",
      resetToken: response.resetToken,
      expiresAt: response.expiresAt
    };
  }

  async function resetPassword(input: ResetPasswordPayload) {
    const response = await postJson<{ message?: string }>(
      "/api/auth/reset-password",
      input
    );
    return response.message ?? "Password updated.";
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  async function refresh() {
    const stored = loadSession();
    if (!stored) {
      setSession(null);
      return;
    }

    try {
      const response = await getJson<unknown>("/api/auth/me", stored);
      const nextSession = { ...stored, user: extractUser(response) };
      setSession(nextSession);
      storeSession(nextSession);
    } catch {
      clearSession();
      setSession(null);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      ready,
      loading,
      error,
      login,
      signup,
      forgotPassword,
      resetPassword,
      logout,
      refresh
    }),
    [session, ready, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
