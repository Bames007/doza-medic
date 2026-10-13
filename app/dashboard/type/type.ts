// config/type.ts
import type { LucideIcon } from "lucide-react";

export type ConsultationType = "inPerson" | "online" | "homeVisit";

export interface MedicNavItem {
  id: string;
  name: string;
  panelId: string;
  icon: LucideIcon;
  badge?: number | string;
  /** Hidden until the medic has been verified by Doza */
  requiresVerification?: boolean;
  /** Only shown if the medic offers at least one of these consultation types */
  consultationTypes?: ConsultationType[];
}

export interface MedicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  profilePhoto?: string | null;
  professionalRole?: string;
  specialties: string[];
  licenseNumber?: string;
  gender: "Male" | "Female" | "";
  yearsOfExperience?: number;
  consultationTypes: {
    inPerson: boolean;
    online: boolean;
    homeVisit: boolean;
  };
  hourlyRate?: number;
  availability?: {
    days: string[];
    hours: { start: string; end: string };
    emergencyAvailable: boolean;
  };
  location?: Record<string, unknown>;
  verified: boolean;
  profileComplete?: boolean;
  status: "pending" | "active" | "suspended" | "rejected";
}

export interface MedicSession {
  medic: MedicUser;
  token: string;
  expiresAt: number;
  lastActivity: number;
}
