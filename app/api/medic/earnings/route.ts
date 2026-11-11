// app/api/medic/earnings/route.ts
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

/** The timestamp at which money was received. Falls back to session start for legacy rows. */
function getPaymentMs(apt: any, sessionStartMs: number): number {
  if (apt.createdAt) {
    const ms = new Date(apt.createdAt).getTime();
    if (!Number.isNaN(ms)) return ms;
  }
  return sessionStartMs;
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

    const snap = await adminDb
      .ref(`${MEDICS_NODE}/${uid}/appointments`)
      .once("value");
    const val = snap.val();
    const raw = val ? (Array.isArray(val) ? val : Object.values(val)) : [];

    const now = Date.now();
    const monthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(
      new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    );
    const lastMonthEnd = monthStart;
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();

    // ── Enrich with computed fields ──────────────────────
    // KEY CHANGE: "paid" is the money-truth, not session completion.
    const enriched = (raw as any[]).map((apt) => {
      const startMs = apt.scheduledAt
        ? new Date(apt.scheduledAt).getTime()
        : new Date(`${apt.date}T${apt.time}`).getTime();
      const durationMs = apt.durationMinutes
        ? apt.durationMinutes * 60_000
        : parseDurationToMs(apt.duration);
      const endMs = startMs + durationMs;
      const isCancelled = apt.status === "cancelled";
      const isCompleted =
        !isCancelled && (apt.status === "completed" || now >= endMs);
      const isUpcoming = !isCancelled && !isCompleted && now < startMs;
      const isOngoing = !isCancelled && !isCompleted && !isUpcoming;
      const amount = Number(apt.amount) || 0;

      // ── Payment model: money is in hand the moment amount > 0 ──
      const isPaid = amount > 0;
      const paymentMs = getPaymentMs(apt, startMs);

      return {
        ...apt,
        _startMs: startMs,
        _endMs: endMs,
        _paymentMs: paymentMs,
        _isCancelled: isCancelled,
        _isCompleted: isCompleted,
        _isUpcoming: isUpcoming,
        _isOngoing: isOngoing,
        _isPaid: isPaid,
        _amount: amount,
      };
    });

    // ── Stats — CASH FLOW view ────────────────────────────
    let totalReceived = 0;
    let monthReceived = 0;
    let lastMonthReceived = 0;
    let scheduledAmount = 0; // money in, session not yet delivered
    let completedAmount = 0; // money in, session delivered
    let cancelledAmount = 0; // money in, session cancelled (no refund tracked)
    let scheduledCount = 0;
    let completedCount = 0;
    let thisMonthPaymentCount = 0;
    let lastMonthPaymentCount = 0;

    for (const a of enriched) {
      if (!a._isPaid) continue;

      totalReceived += a._amount;

      // Track by PAYMENT date, not session date
      if (a._paymentMs >= monthStart) {
        monthReceived += a._amount;
        thisMonthPaymentCount++;
      }
      if (a._paymentMs >= lastMonthStart && a._paymentMs < lastMonthEnd) {
        lastMonthReceived += a._amount;
        lastMonthPaymentCount++;
      }

      // Session-state buckets (informational, no double-count into total)
      if (a._isUpcoming || a._isOngoing) {
        scheduledAmount += a._amount;
        scheduledCount++;
      } else if (a._isCompleted) {
        completedAmount += a._amount;
        completedCount++;
      } else if (a._isCancelled) {
        cancelledAmount += a._amount;
      }
    }

    // ── 6-month cash-flow chart (by PAYMENT date) ─────────
    const chartData: {
      month: string;
      label: string;
      earnings: number;
      sessions: number;
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

      let earnings = 0;
      let sessions = 0;
      for (const a of enriched) {
        if (
          a._isPaid &&
          a._paymentMs >= monthStartI &&
          a._paymentMs < monthEndI
        ) {
          earnings += a._amount;
          sessions++;
        }
      }

      chartData.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        earnings,
        sessions,
      });
    }

    // ── Transaction list — ALL paid, filtered by payment date ─
    let transactions = enriched.filter((a) => a._isPaid);

    if (filter === "month") {
      transactions = transactions.filter((a) => a._paymentMs >= monthStart);
    } else if (filter === "last-month") {
      transactions = transactions.filter(
        (a) => a._paymentMs >= lastMonthStart && a._paymentMs < lastMonthEnd,
      );
    } else if (filter === "year") {
      transactions = transactions.filter((a) => a._paymentMs >= yearStart);
    }

    transactions.sort((a, b) => b._paymentMs - a._paymentMs);
    transactions = transactions.slice(0, 100);

    const serializedTransactions = transactions.map((a) => {
      const status: "scheduled" | "completed" | "cancelled" = a._isCancelled
        ? "cancelled"
        : a._isCompleted
          ? "completed"
          : "scheduled";

      return {
        id: a.id,
        patientId: a.patientId ?? null,
        patientName: a.patientName || "Patient",
        patientProfileImage: a.patientProfileImage ?? null,
        amount: a._amount,
        paymentReference: a.paymentReference ?? null,
        paidAt: new Date(a._paymentMs).toISOString(),
        date: new Date(a._startMs).toISOString(),
        completedAt: a._isCompleted ? new Date(a._endMs).toISOString() : null,
        type:
          a.type === "video" || a.type === "home"
            ? a.type
            : a.consultType === "online"
              ? "video"
              : a.address
                ? "home"
                : "in-person",
        durationMinutes: Math.round((a._endMs - a._startMs) / 60_000),
        status,
        source: a.source ?? "patient_booking",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          // Money in hand
          totalReceived,
          monthReceived,
          lastMonthReceived,
          // Buckets by session state
          scheduledAmount,
          completedAmount,
          cancelledAmount,
          scheduledCount,
          completedCount,
          thisMonthPaymentCount,
          lastMonthPaymentCount,
        },
        chart: chartData,
        transactions: serializedTransactions,
        filter,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic earnings failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load earnings" },
      { status: 500 },
    );
  }
}
