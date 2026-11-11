// app/api/medic/patients/route.ts
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

export async function GET(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const [aptsSnap, reviewsSnap] = await Promise.all([
      adminDb.ref(`${MEDICS_NODE}/${uid}/appointments`).once("value"),
      adminDb.ref(`${MEDICS_NODE}/${uid}/reviews`).once("value"),
    ]);

    const aptsVal = aptsSnap.val();
    const apts = (
      aptsVal ? (Array.isArray(aptsVal) ? aptsVal : Object.values(aptsVal)) : []
    ) as any[];

    const reviewsVal = reviewsSnap.val() || {};
    const reviews = Object.entries(reviewsVal).map(
      ([id, r]: [string, any]) => ({
        id,
        ...r,
      }),
    );

    const now = Date.now();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).getTime();

    // ── Group appointments by patientId ────────────
    const byPatient = new Map<string, any[]>();
    for (const a of apts) {
      const pid = a.patientId;
      if (!pid) continue;
      if (!byPatient.has(pid)) byPatient.set(pid, []);
      byPatient.get(pid)!.push(a);
    }

    const patients: any[] = [];
    let activeThisMonth = 0;
    let newThisMonth = 0;
    let repeatPatients = 0;

    for (const [pid, patientApts] of byPatient.entries()) {
      patientApts.sort((a, b) => {
        const ams = a.scheduledAt
          ? new Date(a.scheduledAt).getTime()
          : new Date(`${a.date}T${a.time}`).getTime();
        const bms = b.scheduledAt
          ? new Date(b.scheduledAt).getTime()
          : new Date(`${b.date}T${b.time}`).getTime();
        return ams - bms;
      });

      const latest = patientApts[patientApts.length - 1];

      let completedSessions = 0;
      let upcomingSessions = 0;
      let totalSpent = 0;
      let lastVisitMs = 0;
      let firstVisitMs = Number.MAX_SAFE_INTEGER;
      let hadActivityThisMonth = false;

      for (const a of patientApts) {
        const startMs = a.scheduledAt
          ? new Date(a.scheduledAt).getTime()
          : new Date(`${a.date}T${a.time}`).getTime();
        const durMs = a.durationMinutes
          ? a.durationMinutes * 60_000
          : parseDurationToMs(a.duration);
        const endMs = startMs + durMs;
        const isCancelled = a.status === "cancelled";
        const isCompleted =
          !isCancelled && (a.status === "completed" || now >= endMs);
        const isUpcoming = !isCancelled && !isCompleted;
        const amount = Number(a.amount) || 0;
        const isPaid = amount > 0;

        if (isPaid) {
          totalSpent += amount;

          const paymentMs = a.createdAt
            ? new Date(a.createdAt).getTime()
            : startMs;
          if (!Number.isNaN(paymentMs) && paymentMs >= monthStart) {
            hadActivityThisMonth = true;
          }
        }

        if (isCompleted) {
          completedSessions++;
          totalSpent += Number(a.amount) || 0;
          if (startMs < firstVisitMs) firstVisitMs = startMs;
          if (startMs > lastVisitMs) lastVisitMs = startMs;
          if (startMs >= monthStart) hadActivityThisMonth = true;
        }
        if (isUpcoming) upcomingSessions++;
      }

      if (hadActivityThisMonth) activeThisMonth++;
      if (completedSessions >= 2) repeatPatients++;

      const firstCompleted =
        firstVisitMs === Number.MAX_SAFE_INTEGER ? 0 : firstVisitMs;
      if (firstCompleted >= monthStart && firstCompleted > 0) newThisMonth++;

      // Pull reviews this patient left (reviews are keyed by appointmentId;
      // each review object stores patientUid, so filter by that).
      const patientReviews = reviews.filter((r: any) => r.patientUid === pid);
      const sortedReviews = [...patientReviews].sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      const lastReview = sortedReviews[0];
      const avgRating =
        patientReviews.length > 0
          ? patientReviews.reduce(
              (s, r: any) => s + (Number(r.stars) || 0),
              0,
            ) / patientReviews.length
          : null;

      patients.push({
        id: pid,
        name: latest.patientName || "Patient",
        profileImage: latest.patientProfileImage ?? null,
        age: latest.patientAge ?? null,
        gender: latest.patientGender ?? null,
        totalSessions: patientApts.length,
        completedSessions,
        upcomingSessions,
        totalSpent,
        firstVisit:
          firstCompleted > 0 ? new Date(firstCompleted).toISOString() : null,
        lastVisit: lastVisitMs > 0 ? new Date(lastVisitMs).toISOString() : null,
        lastRating: lastReview ? Number(lastReview.stars) : null,
        lastComment: lastReview?.comment ?? null,
        ratedCount: patientReviews.length,
        avgRating,
      });
    }

    // Sort by most recent visit
    patients.sort((a, b) => {
      const ams = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
      const bms = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
      return bms - ams;
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalPatients: patients.length,
          activeThisMonth,
          newThisMonth,
          repeatPatients,
        },
        patients,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic patients failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load patients" },
      { status: 500 },
    );
  }
}
