import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { SignupRole, AuthSession } from "../types/auth";
import { ApiError, loginRequest, signupRequest } from "../lib/api";
import {
  createDefaultOnboarding,
  isOnboardingComplete,
  loadOnboarding,
  saveOnboarding
} from "../lib/onboarding";
import { clearSession, loadSession, storeSession } from "../lib/session";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  isVerified: boolean;
  refreshVerification: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    displayName: string;
    role: SignupRole;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationTick, setVerificationTick] = useState(0);

  useEffect(() => {
    setSession(loadSession());
    setLoading(false);
  }, []);

  const refreshVerification = useCallback(() => {
    setVerificationTick((tick) => tick + 1);
  }, []);

  const isVerified = useMemo(() => {
    if (!session) return false;
    const onboarding = loadOnboarding(session.user.id);
    return isOnboardingComplete(onboarding);
  }, [session, verificationTick]);

  const persistSession = useCallback((next: AuthSession) => {
    storeSession(next);
    setSession(next);

    if (!loadOnboarding(next.user.id)) {
      saveOnboarding(createDefaultOnboarding(next.user.id, next.user.displayName));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await loginRequest(email, password);
      persistSession(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in";
      setError(message);
      throw err;
    }
  }, [persistSession]);

  const signup = useCallback(
    async (input: {
      email: string;
      password: string;
      displayName: string;
      role: SignupRole;
    }) => {
      setError(null);
      try {
        const result = await signupRequest(input);
        persistSession(result);
        saveOnboarding(createDefaultOnboarding(result.user.id, input.displayName));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Unable to create account";
        setError(message);
        throw err;
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      session,
      loading,
      error,
      isVerified,
      refreshVerification,
      login,
      signup,
      logout,
      clearError
    }),
    [session, loading, error, isVerified, refreshVerification, login, signup, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}