// app/api/medic/reviews/route.ts
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

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
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
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    const [reviewsSnap, summarySnap, aptsSnap] = await Promise.all([
      adminDb.ref(`${MEDICS_NODE}/${uid}/reviews`).once("value"),
      adminDb.ref(`${MEDICS_NODE}/${uid}/ratingSummary`).once("value"),
      adminDb.ref(`${MEDICS_NODE}/${uid}/appointments`).once("value"),
    ]);

    const reviewsRaw = reviewsSnap.val() || {};
    const reviews = (Object.entries(reviewsRaw) as [string, any][]).map(
      ([id, r]) => {
        const stars = Math.max(1, Math.min(5, Number(r.stars) || 0));
        return {
          id,
          appointmentId: id,
          stars,
          comment: (r.comment || "").trim() || null,
          createdAt: r.createdAt || new Date().toISOString(),
          patientUid: r.patientUid || null,
          patientName: r.patientName || "Anonymous",
          patientImage: r.patientImage || null,
        };
      },
    );

    // Sort newest first
    reviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const summaryVal = summarySnap.val() || { average: 0, count: 0 };

    // ── Response rate: completed patient bookings that COULD be rated ──
    const aptsVal = aptsSnap.val();
    const apts = (
      aptsVal ? (Array.isArray(aptsVal) ? aptsVal : Object.values(aptsVal)) : []
    ) as any[];

    const now = Date.now();
    let completedSessions = 0;
    for (const a of apts) {
      if (a.source !== "patient_booking") continue;
      if (a.status === "cancelled") continue;
      const startMs = a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : new Date(`${a.date}T${a.time}`).getTime();
      const durMs = a.durationMinutes
        ? a.durationMinutes * 60_000
        : parseDurationToMs(a.duration);
      if (a.status === "completed" || now >= startMs + durMs) {
        completedSessions++;
      }
    }
    const ratedSessions = reviews.length;
    const responseRate =
      completedSessions > 0
        ? Math.round((ratedSessions / completedSessions) * 100)
        : 0;

    // ── Star distribution ────────────────────────────
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<
      number,
      number
    >;
    let totalStars = 0;
    for (const r of reviews) {
      distribution[r.stars]++;
      totalStars += r.stars;
    }

    // ── This month / last month ──────────────────────
    const thisMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(
      new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    );
    const lastMonthEnd = thisMonthStart;

    let thisMonthCount = 0;
    let thisMonthTotal = 0;
    let lastMonthCount = 0;
    let lastMonthTotal = 0;

    for (const r of reviews) {
      const ms = new Date(r.createdAt).getTime();
      if (ms >= thisMonthStart) {
        thisMonthCount++;
        thisMonthTotal += r.stars;
      }
      if (ms >= lastMonthStart && ms < lastMonthEnd) {
        lastMonthCount++;
        lastMonthTotal += r.stars;
      }
    }

    // ── 6-month chart (avg rating + count) ───────────
    const chart: {
      month: string;
      label: string;
      average: number;
      count: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      const monthStartI = d.getTime();
      const monthEndI = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        1,
      ).getTime();

      let count = 0;
      let total = 0;
      for (const r of reviews) {
        const ms = new Date(r.createdAt).getTime();
        if (ms >= monthStartI && ms < monthEndI) {
          count++;
          total += r.stars;
        }
      }

      chart.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        average: count > 0 ? total / count : 0,
        count,
      });
    }

    // ── Filter the returned reviews list ────────────
    let filteredReviews = reviews;

    if (filter === "5") filteredReviews = reviews.filter((r) => r.stars === 5);
    else if (filter === "4")
      filteredReviews = reviews.filter((r) => r.stars === 4);
    else if (filter === "3")
      filteredReviews = reviews.filter((r) => r.stars === 3);
    else if (filter === "low")
      filteredReviews = reviews.filter((r) => r.stars <= 2);
    else if (filter === "month")
      filteredReviews = reviews.filter(
        (r) => new Date(r.createdAt).getTime() >= thisMonthStart,
      );

    filteredReviews = filteredReviews.slice(0, 50);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          average: Number(summaryVal.average) || 0,
          count: Number(summaryVal.count) || reviews.length,
          totalStars,
          thisMonthCount,
          thisMonthAvg:
            thisMonthCount > 0 ? thisMonthTotal / thisMonthCount : 0,
          lastMonthCount,
          lastMonthAvg:
            lastMonthCount > 0 ? lastMonthTotal / lastMonthCount : 0,
          distribution,
          completedSessions,
          ratedSessions,
          responseRate,
        },
        chart,
        reviews: filteredReviews,
        filter,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic reviews failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load reviews" },
      { status: 500 },
    );
  }
}
