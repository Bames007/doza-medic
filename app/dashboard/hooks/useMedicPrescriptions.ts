// app/medic/dashboard/hooks/useMedicPrescriptions.ts
"use client";

import useSWR from "swr";
import { authFetcher } from "@/app/utils/client-auth";

export interface PrescriptionDrug {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string | null;
  patientName: string;
  patientProfileImage: string | null;
  createdAt: number | null;
  instructions: string;
  drugs: PrescriptionDrug[];
  appointmentReason: string;
}

export function useMedicPrescriptions() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      prescriptions: Prescription[];
      stats: { total: number; thisMonth: number; uniquePatients: number };
    };
  }>("/api/medic/prescriptions", authFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    shouldRetryOnError: false,
    keepPreviousData: true,
  });

  return {
    prescriptions: data?.data?.prescriptions ?? [],
    stats: data?.data?.stats ?? {
      total: 0,
      thisMonth: 0,
      uniquePatients: 0,
    },
    isLoading,
    error,
    mutate,
  };
}
