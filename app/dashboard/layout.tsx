// app/dashboard/layout.tsx
"use client";

import { useState, useCallback } from "react";

import { MedicProvider, useMedic } from "./DashboardContext";
import MedicSidebar from "./DashboardSideBar";
import MedicHeader from "./DashboardHeader";
import PanelRenderer from "./PanelRenderer";

import MedicNotificationToast from "./components/MedicNotificationToast";
import NotificationToasts from "./components/NotificationToast";

import { useMedicNotifications } from "./hooks/useMedicNotifications";

import { useBackGuard } from "@/app/utils/useBackGuard";
import ExitConfirmModal from "@/app/components/ExitConfirmModal";

function MedicDashboardInner() {
  const [messagesOpen, setMessagesOpen] = useState(false);

  const { activePanel, navigateToPanel } = useMedic();

  // Global patient-message notification listener.
  // This remains mounted regardless of the active dashboard panel.
  const { notifications, dismiss, clearAll } = useMedicNotifications();

  const { showExitConfirm, confirmExit, cancelExit } = useBackGuard({
    activePanel,
    rootPanel: "dashboard",
    onReturnHome: () => navigateToPanel("dashboard"),
  });

  // Open the relevant patient conversation from any dashboard panel.
  const handleOpenChat = useCallback(
    (appointmentId: string) => {
      navigateToPanel("appointments");

      // Wait for the appointments panel to mount before dispatching.
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("doza:open-appointment-chat", {
            detail: { appointmentId },
          }),
        );
      }, 100);
    },
    [navigateToPanel],
  );

  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <MedicSidebar onMessagesToggle={() => setMessagesOpen((p) => !p)} />

        <div className="flex-1 min-w-0 flex flex-col">
          <MedicHeader onMessagesToggle={() => setMessagesOpen((p) => !p)} />

          <main className="flex-1 overflow-y-auto">
            <PanelRenderer />
          </main>
        </div>
      </div>

      {/* GLOBAL PATIENT MESSAGE NOTIFICATIONS */}
      <NotificationToasts
        items={notifications}
        onDismiss={dismiss}
        onOpenChat={handleOpenChat}
      />

      {/* EXISTING DASHBOARD NOTIFICATIONS
          Bookings, payments and patient reviews */}
      <MedicNotificationToast />

      <ExitConfirmModal
        open={showExitConfirm}
        onConfirm={confirmExit}
        onCancel={cancelExit}
        title="CLOSE DOZA MEDIC?"
        body="Are you sure you want to close? Your session stays active — you can come right back."
      />
    </>
  );
}

export default function MedicDashboardLayout() {
  return (
    <MedicProvider>
      <MedicDashboardInner />
    </MedicProvider>
  );
}
