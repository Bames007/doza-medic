// app/dashboard/hooks/useMedicNotifications.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { authFetcher } from "@/app/utils/client-auth";
import {
  playMessageChime,
  primeAudio,
  ensureNotificationPermission,
  showDeviceNotification,
} from "@/app/utils/notify";
import { getOpenChatId, loadSeen, saveSeen } from "@/app/utils/chat-seen-state";
import {
  registerPush,
  listenForServiceWorkerMessages,
} from "@/app/utils/push-client"; // ✅ NEW

export type IncomingNotification = {
  id: string;
  appointmentId: string;
  patientName: string;
  preview: string;
  at: number;
};

type MedicApt = {
  id: string;
  patientName?: string;
  lastMessageAt?: number | null;
  lastMessageSenderRole?: "patient" | "medic" | null;
  lastMessagePreview?: string | null;
};

export function useMedicNotifications() {
  const [notifications, setNotifications] = useState<IncomingNotification[]>(
    [],
  );
  const initializedRef = useRef(false);

  // Unlock audio, ask notification permission, then register the SW
  // push subscription — all on the first user gesture.
  useEffect(() => {
    let done = false;
    const onGesture = async () => {
      if (done) return;
      done = true;
      primeAudio();
      const perm = await ensureNotificationPermission();
      if (perm === "granted") {
        // Fire-and-forget; registration failures are non-fatal.
        void registerPush("medic");
      }
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  // Forward taps on OS notifications into the global chat-open event.
  useEffect(() => listenForServiceWorkerMessages(), []);

  const { data } = useSWR<{ success: boolean; data: MedicApt[] }>(
    "/api/medic/appointments",
    authFetcher,
    {
      refreshInterval: 8000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 4000,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    if (!data?.success || !Array.isArray(data.data)) return;

    const lastSeen = loadSeen();

    if (!initializedRef.current) {
      for (const apt of data.data) {
        if (apt.lastMessageAt && apt.lastMessageAt > (lastSeen[apt.id] ?? 0)) {
          lastSeen[apt.id] = apt.lastMessageAt;
        }
      }
      saveSeen(lastSeen);
      initializedRef.current = true;
      return;
    }

    const incoming: IncomingNotification[] = [];
    const openId = getOpenChatId();

    for (const apt of data.data) {
      if (!apt.lastMessageAt) continue;
      if (apt.lastMessageSenderRole !== "patient") continue;

      const seen = lastSeen[apt.id] ?? 0;
      if (apt.lastMessageAt <= seen) continue;

      lastSeen[apt.id] = apt.lastMessageAt;

      if (openId === apt.id) continue;

      incoming.push({
        id: `${apt.id}-${apt.lastMessageAt}`,
        appointmentId: apt.id,
        patientName: apt.patientName || "Patient",
        preview: apt.lastMessagePreview || "New message",
        at: apt.lastMessageAt,
      });
    }

    saveSeen(lastSeen);

    if (incoming.length) {
      playMessageChime();
      setNotifications((prev) => [...incoming, ...prev].slice(0, 4));

      // Lightweight OS notification when the tab is hidden. The real
      // background/closed case is handled by the service worker push.
      const isBackground =
        typeof document !== "undefined" &&
        (document.hidden || !document.hasFocus());

      if (isBackground) {
        for (const n of incoming) {
          showDeviceNotification(`New message · ${n.patientName}`, n.preview, {
            tag: n.appointmentId,
            silent: true,
            onClick: () => {
              window.dispatchEvent(
                new CustomEvent("doza:open-appointment-chat", {
                  detail: { appointmentId: n.appointmentId },
                }),
              );
            },
          });
        }
      }
    }
  }, [data]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return { notifications, dismiss, clearAll };
}
