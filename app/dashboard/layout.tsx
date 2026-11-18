// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import { MedicProvider, useMedic } from "./DashboardContext";
import MedicSidebar from "./DashboardSideBar";
import MedicHeader from "./DashboardHeader";
import PanelRenderer from "./PanelRenderer";
import MedicNotificationToast from "./components/MedicNotificationToast";
import { useBackGuard } from "@/app/utils/useBackGuard";
import ExitConfirmModal from "@/app/components/ExitConfirmModal";

function MedicDashboardInner() {
  const [messagesOpen, setMessagesOpen] = useState(false);

  const { activePanel, navigateToPanel } = useMedic();

  const { showExitConfirm, confirmExit, cancelExit } = useBackGuard({
    activePanel,
    rootPanel: "dashboard",
    onReturnHome: () => navigateToPanel("dashboard"),
  });

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
