// app/medic/dashboard/hooks/useMedicConversations.ts
"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { authFetcher } from "@/app/utils/client-auth";

// ─── Inbox ─────────────────────────────────────────────
export interface Conversation {
  appointmentId: string;
  patientId: string | null;
  patientName: string;
  patientProfileImage: string | null;
  appointmentStatus: string;
  scheduledAt: string | null;
  consultType: string;
  durationLabel: string;
  reason: string;
  lastMessageText: string;
  lastMessageAt: number | null;
  lastSenderRole: string;
  messageCount: number;
  unread: boolean;
}

export function useMedicConversations() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      conversations: Conversation[];
      stats: { total: number; unread: number };
    };
  }>("/api/medic/conversations", authFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 3000,
    shouldRetryOnError: false,
    keepPreviousData: true,
    refreshInterval: 30_000,
  });

  return {
    conversations: data?.data?.conversations ?? [],
    stats: data?.data?.stats ?? { total: 0, unread: 0 },
    isLoading,
    error,
    mutate,
  };
}

// ─── Chat thread (the fixed one) ────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "patient" | "medic";
  text: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaDurationMs: number | null;
  fileName: string | null;
  fileSize: number | null;
  prescriptionData: any;
  testsData: any;
  noteData: any;
  createdAt: number;
}

export interface ChatMeta {
  patientId: string;
  patientName: string;
  patientProfileImage: string | null;
  medicId: string;
  medicName: string;
  scheduledAt: string;
  scheduledMs: number;
  durationMs: number;
  endedMs: number;
  durationLabel: string;
  status: "waiting" | "active" | "ended";
}

/**
 * 🔴 FIX for "forever loading":
 *
 * The old chat always looked like it was loading because it had no
 * explicit error state — any 404/500/SWR failure fell through to
 * `if (!data) return <Spinner />` and stayed there.
 *
 * This version:
 *   - disables automatic retry on error (so we don't hammer the API),
 *   - exposes `error`, `isForbidden`, `isNotFound` so the component
 *     can render the right state,
 *   - enforces a hard timeout so even a hung request exits to an
 *     error state after 12 s instead of spinning forever,
 *   - polls the thread every 4 s while the session is active.
 */
export function useChatThread(appointmentId: string | null) {
  const key = appointmentId
    ? `/api/appointments/${appointmentId}/messages`
    : null;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      role: "patient" | "medic";
      meta: ChatMeta;
      messages: ChatMessage[];
      ratings: Record<string, any>;
    };
  }>(key, authFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 3000,
    shouldRetryOnError: false,
    keepPreviousData: true,
    refreshInterval: (latest) => {
      const status = latest?.data?.meta?.status;
      return status === "active" || status === "waiting" ? 4000 : 0;
    },
  });

  // Hard timeout — never let the UI hang past 12 s.
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimedOut(false);
    if (!isLoading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      if (isLoading) setTimedOut(true);
    }, 12_000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, appointmentId]);

  const status = (error as any)?.status as number | undefined;
  const isNotFound = status === 404;
  const isForbidden = status === 401 || status === 403;
  const isServerError = status != null && status >= 500;

  const chat = data?.data;
  const loading = isLoading && !data && !error && !timedOut;

  return {
    chat,
    messages: chat?.messages ?? [],
    meta: chat?.meta ?? null,
    role: chat?.role ?? "medic",
    isLoading: loading,
    timedOut,
    error: error || (timedOut ? new Error("Request timed out") : null),
    isNotFound,
    isForbidden,
    isServerError,
    mutate,
    isActive: chat?.meta?.status === "active",
    hasEnded: chat?.meta?.status === "ended",
  };
}
