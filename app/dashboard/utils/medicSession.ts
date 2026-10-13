// lib/medicSession.ts
import type { MedicSession, MedicUser } from "../type/type";

export const MEDIC_SESSION_KEY = "medicSession";
export const MEDIC_TOKEN_KEY = "medicToken";

export function saveMedicSession(input: {
  medic: MedicUser;
  token: string;
  expiresAt: number;
}) {
  if (typeof window === "undefined") return;
  const session: MedicSession = { ...input, lastActivity: Date.now() };
  localStorage.setItem(MEDIC_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(MEDIC_TOKEN_KEY, input.token);
}

export function getMedicSession(): MedicSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEDIC_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as MedicSession;
    if (!session.expiresAt || session.expiresAt < Date.now()) {
      clearMedicSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getMedicToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(MEDIC_TOKEN_KEY);
}

export function updateMedicActivity() {
  const session = getMedicSession();
  if (!session) return;
  session.lastActivity = Date.now();
  localStorage.setItem(MEDIC_SESSION_KEY, JSON.stringify(session));
}

export function clearMedicSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MEDIC_SESSION_KEY);
  localStorage.removeItem(MEDIC_TOKEN_KEY);
}
