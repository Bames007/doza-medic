// app/dashboard/panels/PanelRenderer.tsx
"use client";

import { useMedic } from "./DashboardContext";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

// ─── Medic panels (uncomment as you build each one) ─────────────
// import DashboardPanel from "./DashboardPanel";
// import UpdateProfile from "./UpdateProfile";
import VerificationPanel from "./panels/VerificationPanel";
import DashboardPanel from "./panels/DashboardPanel";
import UpdateProfile from "./panels/ProfilePanel";
import AppointmentsPanel from "./panels/AppointmentPanel";

// import AppointmentsPanel from "./AppointmentsPanel";
// import MessagesPanel from "./MessagesPanel";
// import NotificationsPanel from "./NotificationsPanel";
// import VideoQueuePanel from "./VideoQueuePanel";
// import HomeQueuePanel from "./HomeQueuePanel";
// import ClinicQueuePanel from "./ClinicQueuePanel";
// import PatientsPanel from "./PatientsPanel";
// import MedicalRecordsPanel from "./MedicalRecordsPanel";
// import LabResultsPanel from "./LabResultsPanel";
// import ReferralsPanel from "./ReferralsPanel";
// import PrescriptionsPanel from "./PrescriptionsPanel";
// import AvailabilityPanel from "./AvailabilityPanel";
// import ServicesPanel from "./ServicesPanel";
// import EarningsPanel from "./EarningsPanel";
// import ReviewsPanel from "./ReviewsPanel";
// import SettingsPanel from "./SettingsPanel";
// import HelpPanel from "./HelpPanel";

// ─── Fallback for missing panels ────────────────────────────────
const NotFoundPanel = ({ panel }: { panel: string }) => (
  <div className="flex items-center justify-center h-full p-12">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-700">Panel Not Found</h2>
      <p className="text-slate-500 mt-2">
        No component registered for{" "}
        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-emerald-700">
          {panel}
        </code>
        .
      </p>
    </div>
  </div>
);

export default function PanelRenderer() {
  const { activePanel, medic, isLoading } = useMedic();

  // ─── Loading gate ────────────────────────────────────────────
  if (isLoading || !medic) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <RotateCw
            className="animate-spin text-emerald-600 mx-auto"
            size={32}
          />
          <p className="mt-4 text-slate-500 text-sm">Loading panel…</p>
        </div>
      </div>
    );
  }

  // ─── Panel switch ────────────────────────────────────────────
  const renderPanel = () => {
    switch (activePanel) {
      // ─── Overview ────────────────────────────────────────────
      case "dashboard":
        return <DashboardPanel />;

      case "appointments":
        // return <AppointmentsPanel />;
        return <AppointmentsPanel />;

      case "messages":
        // return <MessagesPanel />;
        return <NotFoundPanel panel="messages" />;

      case "notifications":
        // return <NotificationsPanel />;
        return <NotFoundPanel panel="notifications" />;

      // ─── Consultation queues (shown conditionally by nav) ────
      case "video-queue":
        // return <VideoQueuePanel />;
        return <NotFoundPanel panel="video-queue" />;

      case "home-queue":
        // return <HomeQueuePanel />;
        return <NotFoundPanel panel="home-queue" />;

      case "clinic-queue":
        // return <ClinicQueuePanel />;
        return <NotFoundPanel panel="clinic-queue" />;

      // ─── Clinical ────────────────────────────────────────────
      case "patients":
        // return <PatientsPanel />;
        return <NotFoundPanel panel="patients" />;

      case "records":
        // return <MedicalRecordsPanel />;
        return <NotFoundPanel panel="records" />;

      case "lab-results":
        // return <LabResultsPanel />;
        return <NotFoundPanel panel="lab-results" />;

      case "referrals":
        // return <ReferralsPanel />;
        return <NotFoundPanel panel="referrals" />;

      case "prescriptions":
        // return <PrescriptionsPanel />;
        return <NotFoundPanel panel="prescriptions" />;

      // ─── Practice ────────────────────────────────────────────
      case "availability":
        // return <AvailabilityPanel />;
        return <NotFoundPanel panel="availability" />;

      case "services":
        // return <ServicesPanel />;
        return <NotFoundPanel panel="services" />;

      case "earnings":
        // return <EarningsPanel />;
        return <NotFoundPanel panel="earnings" />;

      case "reviews":
        // return <ReviewsPanel />;
        return <NotFoundPanel panel="reviews" />;

      // ─── Account ─────────────────────────────────────────────
      case "profile":
        return <UpdateProfile />;
      // return <NotFoundPanel panel="reviews" />;

      case "verification":
        return <VerificationPanel />;

      case "settings":
        // return <SettingsPanel />;
        return <NotFoundPanel panel="settings" />;

      case "help":
        // return <HelpPanel />;
        return <NotFoundPanel panel="help" />;

      default:
        return <NotFoundPanel panel={activePanel} />;
    }
  };

  return (
    <motion.div
      key={activePanel}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      {renderPanel()}
    </motion.div>
  );
}
