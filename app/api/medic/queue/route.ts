// app/api/medic/queue/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

type QueueType = "clinic" | "home" | "online";

function parseDurationToMs(label: string | null | undefined): number {
  if (!label) return 60 * 60 * 1000;
  const m = label.toLowerCase().match(/(\d+(?:\.\d+)?)/);
  if (!m) return 60 * 60 * 1000;
  const n = parseFloat(m[1]);
  if (label.toLowerCase().includes("min")) return n * 60 * 1000;
  return n * 60 * 60 * 1000;
}

/** Which queue does an appointment belong to? */
function deriveQueueType(raw: any): QueueType {
  if (raw.type === "video") return "online";
  if (raw.type === "home") return "home";
  if (raw.type === "in-person") return "clinic";
  if (raw.consultType === "online") return "online";
  if (raw.address || raw.location) return "home";
  return "clinic";
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

  const url = new URL(request.url);
  const rawType = (url.searchParams.get("type") || "clinic").toLowerCase();
  const queueType: QueueType =
    rawType === "home" || rawType === "online" ? rawType : "clinic";

  const dateParam = url.searchParams.get("date"); // optional YYYY-MM-DD

  try {
    const snap = await adminDb
      .ref(`${MEDICS_NODE}/${uid}/appointments`)
      .once("value");
    const val = snap.val();
    const raw = val ? (Array.isArray(val) ? val : Object.values(val)) : [];

    const now = Date.now();
    const targetDayKey = dateParam || toDayKey(now);

    // 🔴 FIX: derive type + status once, filter, then sort.
    const mapped = (raw as any[])
      .filter((a) => a?.id)
      .map((a) => {
        const startMs = a.scheduledAt
          ? new Date(a.scheduledAt).getTime()
          : new Date(`${a.date}T${a.time}`).getTime();
        const durationMs =
          a.durationMinutes != null
            ? a.durationMinutes * 60_000
            : parseDurationToMs(a.duration);
        const endMs = startMs + durationMs;
        const dayKey = toDayKey(startMs);

        const isCancelled = a.status === "cancelled";
        const isCompleted =
          !isCancelled && (a.status === "completed" || now >= endMs);
        const isLive =
          !isCancelled &&
          !isCompleted &&
          a.status !== "upcoming" &&
          now >= startMs &&
          now < endMs;
        const isUpcoming = !isCancelled && !isCompleted && !isLive;

        const status: "upcoming" | "live" | "completed" | "cancelled" =
          isCancelled
            ? "cancelled"
            : isCompleted
              ? "completed"
              : isLive
                ? "live"
                : "upcoming";

        const waitingForMs =
          status === "upcoming" && startMs < now
            ? now - startMs
            : status === "live"
              ? now - startMs
              : 0;

        return {
          id: a.id,
          patientId: a.patientId ?? null,
          patientName: a.patientName || "Patient",
          patientProfileImage: a.patientProfileImage ?? null,
          patientAge: a.patientAge ?? null,
          patientGender: a.patientGender ?? null,

          queueType: deriveQueueType(a),
          status,
          startMs,
          endMs,
          scheduledAt: new Date(startMs).toISOString(),
          durationMinutes: Math.round(durationMs / 60_000),
          waitingForMs,

          reason: a.reason || "",
          address: a.address || a.location || null,
          consultType: a.consultType ?? "online",
          amount: a.amount ?? null,
          source: a.source ?? "patient_booking",
          dayKey,
        };
      })
      .filter((a) => a.queueType === queueType && a.dayKey === targetDayKey);

    mapped.sort((a, b) => a.startMs - b.startMs);

    // Stats + next up
    let waiting = 0;
    let live = 0;
    let completed = 0;
    let cancelled = 0;
    let nextUp: any = null;

    for (const a of mapped) {
      if (a.status === "upcoming") waiting++;
      else if (a.status === "live") live++;
      else if (a.status === "completed") completed++;
      else if (a.status === "cancelled") cancelled++;

      if (!nextUp && (a.status === "live" || a.status === "upcoming")) {
        nextUp = {
          id: a.id,
          patientName: a.patientName,
          patientProfileImage: a.patientProfileImage,
          scheduledAt: a.scheduledAt,
          status: a.status,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        type: queueType,
        date: targetDayKey,
        stats: {
          total: mapped.length,
          waiting,
          live,
          completed,
          cancelled,
        },
        nextUp,
        queue: mapped.map(({ startMs, endMs, dayKey, ...rest }) => rest),
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      type: queueType,
      message: "GET medic queue failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load queue" },
      { status: 500 },
    );
  }
}
