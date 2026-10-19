// app/dashboard/type/appointment.ts

export type AppointmentType = "video" | "in-person" | "home";
export type AppointmentStatus =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface Appointment {
  id: string;
  patientName: string;
  patientAge?: number;
  type: AppointmentType;
  status: AppointmentStatus;
  /** ISO timestamp */
  startTime: string;
  /** ISO timestamp */
  endTime: string;
  durationMinutes: number;
  reason: string;
  location?: string;
  notes?: string;
}

export const APPT_TYPE_META: Record<
  AppointmentType,
  { label: string; icon: typeof import("lucide-react").Video }
> = {
  video: { label: "Video", icon: require("lucide-react").Video },
  "in-person": { label: "In-Person", icon: require("lucide-react").User },
  home: { label: "Home Visit", icon: require("lucide-react").Home },
};
