import { LucideProps } from "lucide-react";
import { ComponentType } from "react";

export interface MedicRegistrationData {
  role: "medic";

  // Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    profilePhoto: string | null;
    /**
     * @deprecated Never persisted to the database.
     * Account credentials are managed by Firebase Auth — do NOT send this
     * to RTDB. Kept on the type only so existing form components compile.
     */
    password?: string;
  };

  // Professional Information
  professionalInfo: {
    role: string;
    customRole: string;
    specialties: string[];
    customSpecialty: string;
    licenseNumber: string;
    yearsOfExperience: number;
    qualifications: string[];
    bio: string;
  };

  // Practice & Availability
  practiceInfo: {
    consultationTypes: {
      inPerson: boolean;
      online: boolean;
      homeVisit: boolean;
    };
    hourlyRate: number;
    availability: {
      days: string[];
      hours: {
        start: string;
        end: string;
      };
      emergencyAvailable: boolean;
    };
    languages: string[];
  };

  // Location
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
    serviceRadius: number; // in km
  };

  // Credentials & Documents
  credentials: {
    documents: {
      type: string;
      fileUrl: string;
      fileName: string;
      uploadDate: string;
    }[];
    verified: boolean;
  };

  // Legal
  legal: {
    agreedToTerms: boolean;
    agreedToPrivacy: boolean;
    agreedToCommitment: boolean;
    signature: string;
    date: string;
  };

  // System
  status: "pending" | "approved" | "rejected" | "suspended";
  verified: boolean;
  createdAt: string;
  lastUpdated: string;
  rating?: number;
  totalConsultations?: number;
}

export type RegistrationStep =
  | "role"
  | "personal"
  | "professional"
  | "practice"
  | "credentials"
  | "legal"
  | "success";

export interface MedicRole {
  id: string;
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  specialties: string[];
}

export interface DocumentType {
  id: string;
  label: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in MB
}
