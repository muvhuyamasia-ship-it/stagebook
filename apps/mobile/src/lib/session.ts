import type { User } from "@stagebook/shared";

export interface AuthSession {
  token: string;
  user: User;
}

let memorySession: AuthSession | null = null;

export function loadSession(): AuthSession | null {
  return memorySession;
}

export function storeSession(session: AuthSession) {
  memorySession = session;
}

export function clearSession() {
  memorySession = null;
}