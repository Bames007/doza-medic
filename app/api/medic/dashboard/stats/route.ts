// app/api/medic/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

function parseDurationToMs(label: string | null | undefined): number {
  if (!label) return 60 * 60 * 1000;
  const m = label.toLowerCase().match(/(\d+(?:\.\d+)?)/);
  if (!m) return 60 * 60 * 1000;
  const n = parseFloat(m[1]);
  if (label.toLowerCase().includes("min")) return n * 60 * 1000;
  return n * 60 * 60 * 1000;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

function toDayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const [aptsSnap, ratingSnap, notifSnap] = await Promise.all([
      adminDb.ref(`${MEDICS_NODE}/${uid}/appointments`).once("value"),
      adminDb.ref(`${MEDICS_NODE}/${uid}/ratingSummary`).once("value"),
      adminDb.ref(`${MEDICS_NODE}/${uid}/notifications`).once("value"),
    ]);

    const aptsVal = aptsSnap.val();
    const apts = (
      aptsVal ? (Array.isArray(aptsVal) ? aptsVal : Object.values(aptsVal)) : []
    ) as any[];

    const rating = ratingSnap.val() || { average: 0, count: 0 };
    const notifVal = notifSnap.val();
    const notifs = (
      notifVal
        ? Array.isArray(notifVal)
          ? notifVal
          : Object.values(notifVal)
        : []
    ) as any[];

    const now = Date.now();
    const todayKey = toDayKey(now);
    const monthStart = startOfDay(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );

    let todayCount = 0;
    let monthEarnings = 0;
    let upcomingCount = 0;
    const uniquePatients = new Set<string>();
    const todaySchedule: any[] = [];

    for (const a of apts) {
      const startMs = a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : new Date(`${a.date}T${a.time}`).getTime();
      const durationMs =
        a.durationMinutes != null
          ? a.durationMinutes * 60_000
          : parseDurationToMs(a.duration);
      const endMs = startMs + durationMs;
      const dayKey = toDayKey(startMs);

      if (a.patientId) uniquePatients.add(a.patientId);

      const isCancelled = a.status === "cancelled";
      const effectiveStatus = isCancelled
        ? "cancelled"
        : a.status === "completed"
          ? "completed"
          : now < startMs
            ? "upcoming"
            : now < endMs
              ? "ongoing"
              : "completed";

      if (dayKey === todayKey && !isCancelled) {
        todayCount++;
        todaySchedule.push({
          id: a.id,
          patientName: a.patientName,
          patientProfileImage: a.patientProfileImage ?? null,
          startTime: new Date(startMs).toISOString(),
          endTime: new Date(endMs).toISOString(),
          durationMinutes: Math.round(durationMs / 60_000),
          type:
            a.type === "video" || a.type === "home"
              ? a.type
              : a.consultType === "online"
                ? "video"
                : a.address
                  ? "home"
                  : "in-person",
          reason: a.reason,
          location: a.address || a.location || undefined,
          status: effectiveStatus,
          amount: a.amount ?? null,
          patientId: a.patientId ?? null,
          source: a.source ?? "patient_booking",
        });
      }

      if (
        effectiveStatus === "upcoming" &&
        startMs - now <= 24 * 60 * 60 * 1000 &&
        !isCancelled
      ) {
        upcomingCount++;
      }

      if (a.amount && !isCancelled) {
        const paymentMs = a.createdAt
          ? new Date(a.createdAt).getTime()
          : startMs;
        if (!Number.isNaN(paymentMs) && paymentMs >= monthStart) {
          monthEarnings += Number(a.amount) || 0;
        }
      }
    }

    todaySchedule.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const unreadCount = notifs.filter((n) => !n.read).length;
    const recentNotifications = notifs
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayAppointments: todayCount,
          totalPatients: uniquePatients.size,
          monthEarnings,
          rating: Number(rating.average) || 0,
          ratingCount: Number(rating.count) || 0,
          upcomingCount,
          unreadNotifications: unreadCount,
        },
        todaySchedule,
        recentNotifications,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic dashboard stats failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load dashboard" },
      { status: 500 },
    );
  }
}
