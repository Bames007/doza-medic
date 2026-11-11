// app/medic/dashboard/hooks/useMedicData.ts
"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { authFetcher } from "@/app/utils/client-auth";

// ═════════════════════════════════════════════════════
// Shared types (exported so panels can import them)
// ═════════════════════════════════════════════════════

export type MedicAppointmentType = "video" | "in-person" | "home";
export type MedicAppointmentStatus =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface MedicAppointment {
  id: string;
  patientId: string | null;
  patientName: string;
  patientAge: number | null;
  patientProfileImage: string | null;
  type: MedicAppointmentType;
  status: MedicAppointmentStatus;
  storedStatus: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  location?: string;
  consultType: "online" | "inPerson";
  amount: number | null;
  paymentReference: string | null;
  rating: number | null;
  comment: string | null;
  source: "patient_booking" | "medic_created";
  hasMessages: boolean;
  createdAt: string;
}

export interface MedicDashboardStats {
  todayAppointments: number;
  totalPatients: number;
  monthEarnings: number;
  rating: number;
  ratingCount: number;
  upcomingCount: number;
  unreadNotifications: number;
}

export interface MedicTodayScheduleItem {
  id: string;
  patientName: string;
  patientProfileImage: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: MedicAppointmentType;
  reason: string;
  location?: string;
  status: MedicAppointmentStatus;
  amount: number | null;
  patientId: string | null;
  source: "patient_booking" | "medic_created";
}

export interface MedicNotification {
  id: string;
  type:
    | "appointment_booked"
    | "session_starting"
    | "session_ended"
    | "new_message"
    | "patient_rated"
    | "payment_received";
  title: string;
  body: string;
  appointmentId: string | null;
  patientId: string | null;
  patientName: string | null;
  patientProfileImage: string | null;
  createdAt: string;
  read: boolean;
  readAt: string | null;
}

// ═════════════════════════════════════════════════════
// Appointments
// ═════════════════════════════════════════════════════
export function useMedicAppointments() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: MedicAppointment[];
  }>("/api/medic/appointments", authFetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });

  return {
    appointments: (data?.success ? data.data : []) as MedicAppointment[],
    isLoading,
    error,
    mutate,
  };
}

// ═════════════════════════════════════════════════════
// Dashboard stats
// ═════════════════════════════════════════════════════
const EMPTY_STATS: MedicDashboardStats = {
  todayAppointments: 0,
  totalPatients: 0,
  monthEarnings: 0,
  rating: 0,
  ratingCount: 0,
  upcomingCount: 0,
  unreadNotifications: 0,
};

// ═════════════════════════════════════════════════════
// Earnings
// ═════════════════════════════════════════════════════
export type EarningsFilter = "all" | "month" | "last-month" | "year";

export interface EarningsStats {
  totalReceived: number;
  monthReceived: number;
  lastMonthReceived: number;
  scheduledAmount: number;
  completedAmount: number;
  cancelledAmount: number;
  scheduledCount: number;
  completedCount: number;
  thisMonthPaymentCount: number;
  lastMonthPaymentCount: number;
}

export type EarningsTransactionStatus = "scheduled" | "completed" | "cancelled";

export interface EarningsChartPoint {
  month: string;
  label: string;
  earnings: number;
  sessions: number;
}

export interface EarningsTransaction {
  id: string;
  patientId: string | null;
  patientName: string;
  patientProfileImage: string | null;
  amount: number;
  paymentReference: string | null;
  paidAt: string;
  date: string;
  completedAt: string | null;
  type: "video" | "in-person" | "home";
  durationMinutes: number;
  status: EarningsTransactionStatus;
  source: "patient_booking" | "medic_created";
}

const EMPTY_EARNINGS_STATS: EarningsStats = {
  totalReceived: 0,
  monthReceived: 0,
  lastMonthReceived: 0,
  scheduledAmount: 0,
  completedAmount: 0,
  cancelledAmount: 0,
  scheduledCount: 0,
  completedCount: 0,
  thisMonthPaymentCount: 0,
  lastMonthPaymentCount: 0,
};

export function useMedicEarnings(filter: EarningsFilter = "all") {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      stats: EarningsStats;
      chart: EarningsChartPoint[];
      transactions: EarningsTransaction[];
      filter: string;
    };
  }>(`/api/medic/earnings?filter=${filter}`, authFetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });

  return {
    stats: (data?.data?.stats ?? EMPTY_EARNINGS_STATS) as EarningsStats,
    chart: (data?.data?.chart ?? []) as EarningsChartPoint[],
    transactions: (data?.data?.transactions ?? []) as EarningsTransaction[],
    isLoading,
    error,
    mutate,
  };
}

// ═════════════════════════════════════════════════════
// Reviews
// ═════════════════════════════════════════════════════
export type ReviewsFilter = "all" | "5" | "4" | "3" | "low" | "month";

export interface ReviewStarDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ReviewsSummary {
  average: number;
  count: number;
  totalStars: number;
  thisMonthCount: number;
  thisMonthAvg: number;
  lastMonthCount: number;
  lastMonthAvg: number;
  distribution: ReviewStarDistribution;
  completedSessions: number;
  ratedSessions: number;
  responseRate: number;
}

export interface ReviewChartPoint {
  month: string;
  label: string;
  average: number;
  count: number;
}

export interface PatientReview {
  id: string;
  appointmentId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  patientUid: string | null;
  patientName: string;
  patientImage: string | null;
}

const EMPTY_REVIEWS_SUMMARY: ReviewsSummary = {
  average: 0,
  count: 0,
  totalStars: 0,
  thisMonthCount: 0,
  thisMonthAvg: 0,
  lastMonthCount: 0,
  lastMonthAvg: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  completedSessions: 0,
  ratedSessions: 0,
  responseRate: 0,
};

export function useMedicReviews(filter: ReviewsFilter = "all") {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      summary: ReviewsSummary;
      chart: ReviewChartPoint[];
      reviews: PatientReview[];
      filter: string;
    };
  }>(`/api/medic/reviews?filter=${filter}`, authFetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });

  return {
    summary: (data?.data?.summary ?? EMPTY_REVIEWS_SUMMARY) as ReviewsSummary,
    chart: (data?.data?.chart ?? []) as ReviewChartPoint[],
    reviews: (data?.data?.reviews ?? []) as PatientReview[],
    isLoading,
    error,
    mutate,
  };
}

// ═════════════════════════════════════════════════════
// Availability
// ═════════════════════════════════════════════════════
export type MedicStatus = "online" | "away" | "offline" | "on-leave";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface MedicAvailability {
  days: Weekday[];
  hours: { start: string; end: string };
  breakTime: { start: string; end: string } | null;
  emergencyAvailable: boolean;
  emergencyPremium: number;
  instantTalk: boolean;
  instantTalkWindowMinutes: number;
  instantTalkPremium: number;
  maxPerDay: number;
  bufferMinutes: number;
  advanceBookingDays: number;
  timezone: string;
}

export interface AvailabilityResponse {
  availability: MedicAvailability;
  status: MedicStatus;
  effectiveStatus: MedicStatus;
  statusUpdatedAt: string | null;
  isStale: boolean;
}

const EMPTY_AVAILABILITY: MedicAvailability = {
  days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  hours: { start: "09:00", end: "17:00" },
  breakTime: null,
  emergencyAvailable: false,
  emergencyPremium: 0,
  instantTalk: false,
  instantTalkWindowMinutes: 15,
  instantTalkPremium: 0,
  maxPerDay: 12,
  bufferMinutes: 10,
  advanceBookingDays: 30,
  timezone: "Africa/Lagos",
};

export function useMedicAvailability() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: AvailabilityResponse;
  }>("/api/medic/availability", authFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10_000,
    keepPreviousData: true,
  });

  return {
    availability: (data?.data?.availability ??
      EMPTY_AVAILABILITY) as MedicAvailability,
    status: (data?.data?.status ?? "offline") as MedicStatus,
    effectiveStatus: (data?.data?.effectiveStatus ?? "offline") as MedicStatus,
    statusUpdatedAt: data?.data?.statusUpdatedAt ?? null,
    isStale: !!data?.data?.isStale,
    isLoading,
    error,
    mutate,
  };
}

// ═════════════════════════════════════════════════════
// Services & Pricing
// ═════════════════════════════════════════════════════
export interface ConsultationTypes {
  inPerson: boolean;
  online: boolean;
  homeVisit: boolean;
}

export interface PricingConfig {
  inPersonRate: number;
  onlineRate: number;
  homeVisitRate: number;
  homeVisitFee: number;
  urgentFee: number;
  followUpDiscountPct: number;
}

export type ServiceType = "video" | "in-person" | "home" | "any";

export interface MedicService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  type: ServiceType;
  active: boolean;
}

export interface ServicesResponse {
  hourlyRate: number;
  consultationTypes: ConsultationTypes;
  pricing: PricingConfig;
  services: MedicService[];
}

const EMPTY_SERVICES: ServicesResponse = {
  hourlyRate: 0,
  consultationTypes: { inPerson: true, online: false, homeVisit: false },
  pricing: {
    inPersonRate: 0,
    onlineRate: 0,
    homeVisitRate: 0,
    homeVisitFee: 0,
    urgentFee: 0,
    followUpDiscountPct: 0,
  },
  services: [],
};

export function useMedicServices() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ServicesResponse;
  }>("/api/medic/services", authFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10_000,
    keepPreviousData: true,
  });

  return {
    services: (data?.data ?? EMPTY_SERVICES) as ServicesResponse,
    isLoading,
    error,
    mutate,
  };
}

// ═════════════════════════════════════════════════════
// Patients
// ═════════════════════════════════════════════════════
export interface PatientStats {
  totalPatients: number;
  activeThisMonth: number;
  newThisMonth: number;
  repeatPatients: number;
}

export interface PatientSummary {
  id: string;
  name: string;
  profileImage: string | null;
  age: number | null;
  gender: string | null;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalSpent: number;
  firstVisit: string | null;
  lastVisit: string | null;
  lastRating: number | null;
  lastComment: string | null;
  ratedCount: number;
  avgRating: number | null;
}

const EMPTY_PATIENT_STATS: PatientStats = {
  totalPatients: 0,
  activeThisMonth: 0,
  newThisMonth: 0,
  repeatPatients: 0,
};

export function useMedicPatients() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      stats: PatientStats;
      patients: PatientSummary[];
    };
  }>("/api/medic/patients", authFetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });

  return {
    stats: (data?.data?.stats ?? EMPTY_PATIENT_STATS) as PatientStats,
    patients: (data?.data?.patients ?? []) as PatientSummary[],
    isLoading,
    error,
    mutate,
  };
}

export function useMedicStats() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      stats: MedicDashboardStats;
      todaySchedule: MedicTodayScheduleItem[];
      recentNotifications: MedicNotification[];
    };
  }>("/api/medic/dashboard/stats", authFetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });

  return {
    stats: (data?.data?.stats ?? EMPTY_STATS) as MedicDashboardStats,
    todaySchedule: (data?.data?.todaySchedule ??
      []) as MedicTodayScheduleItem[],
    recentNotifications: (data?.data?.recentNotifications ??
      []) as MedicNotification[],
    isLoading,
    error,
    mutate,
  };
}

// ═════════════════════════════════════════════════════
// Notifications
// ═════════════════════════════════════════════════════
export function useMedicNotifications() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      notifications: MedicNotification[];
      unread: number;
    };
  }>("/api/medic/notifications", authFetcher, {
    refreshInterval: 5_000,
    revalidateOnFocus: true,
    dedupingInterval: 2_000,
    keepPreviousData: true,
  });

  return {
    notifications: (data?.data?.notifications ?? []) as MedicNotification[],
    unread: (data?.data?.unread ?? 0) as number,
    isLoading,
    error,
    mutate,
  };
}

/** Invalidate everything after a mutation. */
export function refreshMedicData() {
  globalMutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith("/api/medic/") || key.startsWith("/api/appointments")),
  );
}
