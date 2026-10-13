// config/medic-navigation.ts
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  Pill,
  FileText,
  Microscope,
  Clock,
  Wallet,
  Star,
  MessageSquare,
  UserCircle,
  ShieldCheck,
  Settings,
  Bell,
  Video,
  Home,
  ClipboardList,
} from "lucide-react";
import type { MedicNavItem, ConsultationType } from "../type/type";

export const medicNavigation: MedicNavItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    panelId: "dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "appointments",
    name: "Appointments",
    panelId: "appointments",
    icon: Calendar,
  },
  // {
  //   id: "messages",
  //   name: "Messages",
  //   panelId: "messages",
  //   icon: MessageSquare,
  // },
  // {
  //   id: "notifications",
  //   name: "Notifications",
  //   panelId: "notifications",
  //   icon: Bell,
  // },

  {
    id: "video-queue",
    name: "Video Consults",
    panelId: "video-queue",
    icon: Video,
    consultationTypes: ["online"],
  },
  {
    id: "home-queue",
    name: "Home Visits",
    panelId: "home-queue",
    icon: Home,
    consultationTypes: ["homeVisit"],
  },
  // {
  //   id: "clinic-queue",
  //   name: "In-Person Queue",
  //   panelId: "clinic-queue",
  //   icon: Stethoscope,
  //   consultationTypes: ["inPerson"],
  // },

  { id: "patients", name: "My Patients", panelId: "patients", icon: Users },
  {
    id: "records",
    name: "Medical Records",
    panelId: "records",
    icon: FileText,
  },
  // {
  //   id: "lab-results",
  //   name: "Lab Results",
  //   panelId: "lab-results",
  //   icon: Microscope,
  // },
  {
    id: "referrals",
    name: "Referrals",
    panelId: "referrals",
    icon: ClipboardList,
  },
  {
    id: "prescriptions",
    name: "Prescriptions",
    panelId: "prescriptions",
    icon: Pill,
    requiresVerification: true,
  },

  {
    id: "availability",
    name: "Availability",
    panelId: "availability",
    icon: Clock,
  },
  {
    id: "services",
    name: "Services & Pricing",
    panelId: "services",
    icon: FileText,
  },
  {
    id: "earnings",
    name: "Earnings",
    panelId: "earnings",
    icon: Wallet,
    requiresVerification: true,
  },
  { id: "reviews", name: "Reviews", panelId: "reviews", icon: Star },

  // { id: "profile", name: "Profile", panelId: "profile", icon: UserCircle },
  {
    id: "verification",
    name: "Verification",
    panelId: "verification",
    icon: ShieldCheck,
  },
  // { id: "settings", name: "Settings", panelId: "settings", icon: Settings },
];

export function getMedicNavigation(
  medic?: {
    verified?: boolean;
    consultationTypes?: {
      inPerson?: boolean;
      online?: boolean;
      homeVisit?: boolean;
    };
  } | null,
): MedicNavItem[] {
  const verified = medic?.verified ?? false;
  const ct = medic?.consultationTypes ?? {};
  const offered: ConsultationType[] = [];
  if (ct.inPerson) offered.push("inPerson");
  if (ct.online) offered.push("online");
  if (ct.homeVisit) offered.push("homeVisit");

  return medicNavigation.filter((item) => {
    if (item.requiresVerification && !verified) return false;
    if (item.consultationTypes) {
      if (offered.length === 0) return false;
      return item.consultationTypes.some((t) => offered.includes(t));
    }
    return true;
  });
}
