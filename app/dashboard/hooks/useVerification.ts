// app/dashboard/verification/hooks/useVerification.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { ref, get, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/utils/firebaseConfig";
import type { MedicRegistrationData } from "../type/registration_type";

/**
 * Global toggle for the credential upload flow.
 * When false, the Credentials step is treated as complete even without
 * documents — lets users progress while storage is being finalized.
 * Flip to true (and remove the bypass below) once uploads are live.
 */
const UPLOADS_ENABLED = false;

export type StepId =
  | "role"
  | "personal"
  | "professional"
  | "practice"
  | "credentials"
  | "legal";

export interface ProgressStep {
  id: StepId;
  label: string;
  weight: number;
  done: boolean;
}

export const STEP_ORDER: StepId[] = [
  "role",
  "personal",
  "professional",
  "practice",
  "credentials",
  "legal",
];

export const STEP_META: Record<StepId, { label: string; weight: number }> = {
  role: { label: "Professional Role", weight: 10 },
  personal: { label: "Personal Info", weight: 20 },
  professional: { label: "Professional Background", weight: 20 },
  practice: { label: "Practice Setup", weight: 20 },
  credentials: { label: "Credentials", weight: 20 },
  legal: { label: "Legal Agreement", weight: 10 },
};

export const emptyRegistration: MedicRegistrationData = {
  role: "medic",
  personalInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePhoto: null,
    password: "",
  },
  professionalInfo: {
    role: "",
    customRole: "",
    specialties: [],
    customSpecialty: "",
    licenseNumber: "",
    yearsOfExperience: 0,
    qualifications: [],
    bio: "",
  },
  practiceInfo: {
    consultationTypes: { inPerson: true, online: false, homeVisit: false },
    hourlyRate: 0,
    availability: {
      days: [],
      hours: { start: "09:00", end: "17:00" },
      emergencyAvailable: false,
    },
    languages: ["English"],
  },
  location: {
    address: "",
    city: "",
    state: "",
    country: "",
    lat: 0,
    lng: 0,
    serviceRadius: 50,
  },
  credentials: { documents: [], verified: false },
  legal: {
    agreedToTerms: false,
    agreedToPrivacy: false,
    agreedToCommitment: false,
    signature: "",
    date: "",
  },
  status: "pending",
  verified: false,
  createdAt: "",
  lastUpdated: "",
};

function isStepDone(id: StepId, d: MedicRegistrationData): boolean {
  switch (id) {
    case "role":
      return !!d.professionalInfo.role?.trim();

    case "personal": {
      const p = d.personalInfo;
      return !!(
        p.firstName?.trim() &&
        p.lastName?.trim() &&
        p.email?.trim() &&
        p.phone?.trim() &&
        p.dateOfBirth &&
        p.gender
      );
    }

    case "professional": {
      const p = d.professionalInfo;
      const hasSpecialty =
        p.specialties.length > 0 || p.customSpecialty?.trim().length > 0;
      return !!(
        p.licenseNumber?.trim() &&
        p.yearsOfExperience > 0 &&
        hasSpecialty &&
        p.qualifications.length > 0
      );
    }

    case "practice": {
      const pr = d.practiceInfo;
      const hasConsult = Object.values(pr.consultationTypes).some(Boolean);
      return !!(
        pr.hourlyRate > 0 &&
        pr.availability.days.length > 0 &&
        hasConsult &&
        d.location.address?.trim() &&
        d.location.city?.trim()
      );
    }

    case "credentials":
      // TEMP bypass while uploads are disabled.
      if (!UPLOADS_ENABLED) return true;
      return d.credentials.documents.length >= 3;

    case "legal": {
      const l = d.legal;
      return !!(
        l.agreedToTerms &&
        l.agreedToPrivacy &&
        l.agreedToCommitment &&
        l.signature?.trim()
      );
    }
  }
}

/**
 * Strips fields that must never be persisted to RTDB.
 * Currently: personalInfo.password.
 */
function stripSensitive(
  section: keyof MedicRegistrationData,
  value: unknown,
): unknown {
  if (section !== "personalInfo") return value;
  if (!value || typeof value !== "object") return value;
  const { password: _pw, ...rest } = value as Record<string, unknown>;
  return rest;
}

export interface SubmittedMeta {
  profileComplete: boolean;
  status: string;
  verified: boolean;
  submittedAt?: string;
  rejectionReason?: string;
}

export function useVerification() {
  const [uid, setUid] = useState<string | null>(null);
  const [data, setData] = useState<MedicRegistrationData>(emptyRegistration);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SubmittedMeta>({
    profileComplete: false,
    status: "pending",
    verified: false,
  });

  // ── Load from Firebase ────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const snap = await get(ref(db, `doza_medics/${user.uid}`));
        if (snap.exists()) {
          const r = snap.val();
          setData({
            role: "medic",
            personalInfo: {
              ...emptyRegistration.personalInfo,
              ...(r.personalInfo || {}),
            },
            professionalInfo: {
              ...emptyRegistration.professionalInfo,
              ...(r.professionalInfo || {}),
            },
            practiceInfo: {
              ...emptyRegistration.practiceInfo,
              ...(r.practiceInfo || {}),
              consultationTypes: {
                ...emptyRegistration.practiceInfo.consultationTypes,
                ...(r.practiceInfo?.consultationTypes || {}),
              },
              availability: {
                ...emptyRegistration.practiceInfo.availability,
                ...(r.practiceInfo?.availability || {}),
                hours: {
                  ...emptyRegistration.practiceInfo.availability.hours,
                  ...(r.practiceInfo?.availability?.hours || {}),
                },
              },
            },
            location: { ...emptyRegistration.location, ...(r.location || {}) },
            credentials: {
              ...emptyRegistration.credentials,
              ...(r.credentials || {}),
            },
            legal: { ...emptyRegistration.legal, ...(r.legal || {}) },
            status: r.status ?? "pending",
            verified: !!r.verified,
            createdAt: r.createdAt ?? "",
            lastUpdated: r.lastUpdated ?? "",
          });
          setMeta({
            profileComplete: !!r.profileComplete,
            status: r.status ?? "pending",
            verified: !!r.verified,
            submittedAt: r.submittedAt,
            rejectionReason: r.rejectionReason,
          });
        }
      } catch (e) {
        console.error("[useVerification] load error", e);
        setError("Could not load your profile. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // ── Recompute progress whenever data changes ──────────────────
  useEffect(() => {
    const steps: ProgressStep[] = STEP_ORDER.map((id) => ({
      id,
      label: STEP_META[id].label,
      weight: STEP_META[id].weight,
      done: isStepDone(id, data),
    }));
    setProgress(steps);
    setPercent(steps.reduce((s, x) => s + (x.done ? x.weight : 0), 0));
  }, [data]);

  // ── Local state update (does NOT persist) ─────────────────────
  const patchLocal = useCallback((updates: Partial<MedicRegistrationData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Save a section to DB ──────────────────────────────────────
  const saveSection = useCallback(
    async (
      section: keyof MedicRegistrationData,
      value: MedicRegistrationData[keyof MedicRegistrationData],
    ) => {
      if (!uid) return;
      setSaving(true);
      setError(null);
      try {
        const safeValue = stripSensitive(section, value);
        await update(ref(db, `doza_medics/${uid}`), {
          [section]: safeValue,
          lastUpdated: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[saveSection]", e);
        setError(
          "Could not save your progress. Check your connection and try again.",
        );
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [uid],
  );

  // ── Final submit — server route handles validation + admin queue ──
  const submitForReview = useCallback(async () => {
    if (!uid) return;
    setSaving(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      // Never send password to the server.
      const { password: _pw, ...safePersonal } = data.personalInfo;
      const payload = { ...data, personalInfo: safePersonal };

      const res = await fetch("/api/verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Submit failed. Please try again.");
      }

      const { submittedAt } = (await res.json()) as { submittedAt: string };

      setMeta({
        profileComplete: true,
        status: "pending",
        verified: false,
        submittedAt,
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Submit failed. Please try again.";
      console.error("[submitForReview]", e);
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [uid, data]);

  return {
    uid,
    data,
    patchLocal,
    progress,
    percent,
    loading,
    saving,
    error,
    meta,
    saveSection,
    submitForReview,
  };
}
