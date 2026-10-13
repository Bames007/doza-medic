// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import { MedicProvider } from "./DashboardContext"; // ← the context file with useMedic
import MedicSidebar from "./DashboardSideBar";
import MedicHeader from "./DashboardHeader";
import PanelRenderer from "./PanelRenderer";

export default function MedicDashboardLayout() {
  const [messagesOpen, setMessagesOpen] = useState(false);

  return (
    <MedicProvider>
      <div className="flex min-h-screen bg-slate-50">
        <MedicSidebar onMessagesToggle={() => setMessagesOpen((p) => !p)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <MedicHeader onMessagesToggle={() => setMessagesOpen((p) => !p)} />
          <main className="flex-1 overflow-y-auto">
            <PanelRenderer />
          </main>
        </div>
      </div>
    </MedicProvider>
  );
}
