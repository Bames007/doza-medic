// app/dashboard/components/NotificationToast.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import type { IncomingNotification } from "../hooks/useMedicNotifications";

export default function NotificationToasts({
  items,
  onDismiss,
  onOpenChat,
}: {
  items: IncomingNotification[];
  onDismiss: (id: string) => void;
  onOpenChat: (appointmentId: string) => void;
}) {
  // Fall back to the message icon if the logo asset fails to load.
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="fixed right-3 left-3 sm:left-auto sm:right-4 bottom-4 z-[450] flex flex-col gap-2 sm:w-80 pointer-events-none">
      <AnimatePresence>
        {items.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-emerald-200 p-3 flex items-start gap-3"
          >
            {/* Doza logo badge (falls back to message icon if /logo.png
                is missing) */}
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
              {logoError ? (
                <div className="w-full h-full bg-emerald-600 text-white flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
              ) : (
                <img
                  src="/logo.png"
                  alt="Doza Medic"
                  className="w-full h-full object-contain p-0.5"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenChat(n.appointmentId);
                onDismiss(n.id);
              }}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide leading-tight">
                New message
              </p>
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                {n.patientName}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {n.preview}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onDismiss(n.id)}
              aria-label="Dismiss"
              className="shrink-0 min-h-8 min-w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
