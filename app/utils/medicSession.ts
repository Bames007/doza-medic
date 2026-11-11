// app/medic/dashboard/utils/medicSession.ts
import type { MedicUser } from "../dashboard/type/type";

const STORAGE_KEY = "medicSession";

// 24 hours, in milliseconds
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface MedicSession {
  medic: MedicUser;
  token: string;
  expiresAt: number;
}

/**
 * Persist a medic session to localStorage.
 * Merges into any existing session so extra fields (like lastActivity)
 * aren't lost on re-save.
 */
export function saveMedicSession(input: {
  medic: MedicUser;
  token: string;
  expiresAt: number;
}): void {
  if (typeof window === "undefined") return;
  try {
    const session: MedicSession = {
      medic: input.medic,
      token: input.token,
      expiresAt: input.expiresAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage full or disabled — nothing we can do
  }
}

/**
 * Read the current medic session.
 * Returns null if:
 *  - we're on the server
 *  - there's no stored session
 *  - the JSON is corrupt
 *  - the session has expired
 *
 * Expired sessions are removed automatically.
 */
export function getMedicSession(): MedicSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MedicSession;
    if (!parsed?.medic?.id) return null;

    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Wipe the medic session from localStorage.
 */
export function clearMedicSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Convenience — is there a valid, non-expired session right now?
 */
export function hasValidMedicSession(): boolean {
  return getMedicSession() !== null;
}
