// app/medic/dashboard/hooks/useMedicQueues.ts
"use client";

import useSWR from "swr";
import { authFetcher } from "@/app/utils/client-auth";

export type QueueType = "clinic" | "home" | "online";

export interface QueueItem {
  id: string;
  patientId: string | null;
  patientName: string;
  patientProfileImage: string | null;
  patientAge: number | null;
  patientGender: string | null;
  queueType: QueueType;
  status: "upcoming" | "live" | "completed" | "cancelled";
  scheduledAt: string;
  durationMinutes: number;
  waitingForMs: number;
  reason: string;
  address: string | null;
  consultType: string;
  amount: number | null;
  source: string;
}

export interface QueueStats {
  total: number;
  waiting: number;
  live: number;
  completed: number;
  cancelled: number;
}

export interface QueueResponse {
  type: QueueType;
  date: string;
  stats: QueueStats;
  nextUp: {
    id: string;
    patientName: string;
    patientProfileImage: string | null;
    scheduledAt: string;
    status: string;
  } | null;
  queue: QueueItem[];
}

export function useMedicQueue(type: QueueType, date?: string) {
  const key = `/api/medic/queue?type=${type}${date ? `&date=${date}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: QueueResponse;
  }>(key, authFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 3000,
    shouldRetryOnError: false,
    keepPreviousData: true,
    // Refresh every 30s while the panel is open
    refreshInterval: 30_000,
  });

  return {
    queue: data?.data?.queue ?? [],
    stats: data?.data?.stats ?? {
      total: 0,
      waiting: 0,
      live: 0,
      completed: 0,
      cancelled: 0,
    },
    nextUp: data?.data?.nextUp ?? null,
    date: data?.data?.date ?? null,
    isLoading,
    error,
    mutate,
  };
}
