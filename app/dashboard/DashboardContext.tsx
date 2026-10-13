// app/dashboard/DashboardContext.tsx (the file you import as MedicContext)
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/app/utils/firebaseConfig";
import type { MedicUser } from "./type/type";

// ─── Types ──────────────────────────────────────────────────────
interface MedicContextType {
  medic: MedicUser | null;
  setMedic: (m: MedicUser) => void;
  logout: () => Promise<void>;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  isSessionValid: boolean;
  refreshSession: () => Promise<void>;
  navigateToPanel: (panelId: string) => void;
}

const MedicContext = createContext<MedicContextType | undefined>(undefined);

const MEDIC_SESSION_KEY = "medicSession";

// ─── Panel ID → display label ───────────────────────────────────
const panelToPageName: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments",
  messages: "Messages",
  notifications: "Notifications",
  "video-queue": "Video Consults",
  "home-queue": "Home Visits",
  "clinic-queue": "In-Person Queue",
  patients: "My Patients",
  records: "Medical Records",
  "lab-results": "Lab Results",
  referrals: "Referrals",
  prescriptions: "Prescriptions",
  availability: "Availability",
  services: "Services & Pricing",
  earnings: "Earnings",
  reviews: "Reviews",
  profile: "Profile",
  verification: "Verification",
  settings: "Settings",
  help: "Help",
};

// ─── Session helpers ────────────────────────────────────────────
interface StoredMedicSession {
  medic: MedicUser;
  token: string;
  expiresAt: number;
  lastActivity: number;
}

function readLocalSession(): StoredMedicSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEDIC_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMedicSession;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      localStorage.removeItem(MEDIC_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalSession(session: StoredMedicSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEDIC_SESSION_KEY, JSON.stringify(session));
}

function clearLocalSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MEDIC_SESSION_KEY);
}

// ─── Build a MedicUser from a raw Firebase record ───────────────
function toMedicUser(uid: string, r: any): MedicUser {
  return {
    id: uid,
    email: r.personalInfo.email,
    firstName: r.personalInfo.firstName,
    lastName: r.personalInfo.lastName,
    fullName: `${r.personalInfo.firstName} ${r.personalInfo.lastName}`.trim(),
    phone: r.personalInfo.phone,
    gender: r.personalInfo.gender ?? "",
    profilePhoto: r.personalInfo.profilePhoto ?? null,
    professionalRole: r.professionalInfo?.role,
    specialties: r.professionalInfo?.specialties ?? [],
    licenseNumber: r.professionalInfo?.licenseNumber,
    yearsOfExperience: r.professionalInfo?.yearsOfExperience,
    consultationTypes: r.practiceInfo?.consultationTypes ?? {
      inPerson: true,
      online: false,
      homeVisit: false,
    },
    hourlyRate: r.practiceInfo?.hourlyRate,
    availability: r.practiceInfo?.availability,
    location: r.location,
    verified: !!r.verified,
    status: r.status ?? "pending",
    profileComplete: !!r.profileComplete,
  };
}

// ─── Provider ───────────────────────────────────────────────────
export const MedicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();

  const [medic, setMedic] = useState<MedicUser | null>(null);
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [activePanel, setActivePanel] = useState("dashboard"); // ← plain id
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("[medic/logout]", e);
    }
    clearLocalSession();
    setMedic(null);
    setIsSessionValid(false);
    router.push("/");
  }, [router]);

  // ── Refresh from Firebase ──────────────────────────────────
  const refreshSession = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const snap = await get(ref(db, `doza_medics/${uid}`));
      if (!snap.exists()) return;
      const fresh = toMedicUser(uid, snap.val());
      setMedic(fresh);
      const local = readLocalSession();
      if (local) {
        writeLocalSession({ ...local, medic: fresh, lastActivity: Date.now() });
      }
    } catch (e) {
      console.error("[medic/refresh]", e);
    }
  }, []);

  // ── Init: watch Firebase Auth + hydrate from localStorage ──
  useEffect(() => {
    const local = readLocalSession();
    if (local) {
      setMedic(local.medic);
      setIsSessionValid(true);
      setIsLoading(false);
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearLocalSession();
        setMedic(null);
        setIsSessionValid(false);
        setIsLoading(false);
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          router.replace("/");
        }
        return;
      }

      try {
        const snap = await get(ref(db, `doza_medics/${user.uid}`));
        if (!snap.exists()) {
          await signOut(auth);
          clearLocalSession();
          setMedic(null);
          setIsSessionValid(false);
          setIsLoading(false);
          router.replace("/");
          return;
        }

        const fresh = toMedicUser(user.uid, snap.val());
        setMedic(fresh);
        setIsSessionValid(true);
        writeLocalSession({
          medic: fresh,
          token: user.uid,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          lastActivity: Date.now(),
        });
      } catch (e) {
        console.error("[medic/init]", e);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Activity ping ──────────────────────────────────────────
  useEffect(() => {
    const updateActivity = () => {
      const local = readLocalSession();
      if (local) writeLocalSession({ ...local, lastActivity: Date.now() });
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((ev) =>
      document.addEventListener(ev, updateActivity, { passive: true }),
    );
    return () =>
      events.forEach((ev) => document.removeEventListener(ev, updateActivity));
  }, []);

  // ── Navigation: pure state setter, no router ───────────────
  const navigateToPanel = useCallback((panelId: string) => {
    const clean = panelId.replace(/^\/+/, ""); // strip leading slashes
    const pageName = panelToPageName[clean] || clean;
    setActivePanel(clean);
    setCurrentPage(pageName);
    setMobileMenuOpen(false);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const value: MedicContextType = {
    medic,
    setMedic,
    logout,
    currentPage,
    setCurrentPage,
    activePanel,
    setActivePanel,
    sidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
    isLoading,
    isSessionValid,
    refreshSession,
    navigateToPanel,
  };

  return (
    <MedicContext.Provider value={value}>{children}</MedicContext.Provider>
  );
};

export const useMedic = () => {
  const context = useContext(MedicContext);
  if (!context) throw new Error("useMedic must be used within MedicProvider");
  return context;
};
