// app/api/medic/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import { z } from "zod";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

const createSchema = z.object({
  patientName: z.string().min(1),
  patientAge: z.number().int().positive().optional(),
  type: z.enum(["video", "in-person", "home"]),
  date: z.string().min(1),
  time: z.string().min(1),
  durationMinutes: z.number().int().positive().default(30),
  reason: z.string().min(1),
  location: z.string().optional(),
});

// ─── Helpers ─────────────────────────────────────────
function parseDurationToMs(label: string | null | undefined): number {
  if (!label) return 60 * 60 * 1000;
  const m = label.toLowerCase().match(/(\d+(?:\.\d+)?)/);
  if (!m) return 60 * 60 * 1000;
  const n = parseFloat(m[1]);
  if (label.toLowerCase().includes("min")) return n * 60 * 1000;
  return n * 60 * 60 * 1000;
}

function computeEndMs(startMs: number, durationLabel?: string, mins?: number) {
  if (mins) return startMs + mins * 60_000;
  return startMs + parseDurationToMs(durationLabel);
}

function deriveUiStatus(
  stored: string,
  startMs: number,
  endMs: number,
  now: number,
) {
  if (stored === "completed" || stored === "cancelled") return stored;
  if (now < startMs) return "upcoming";
  if (now < endMs) return "ongoing";
  return "completed";
}

async function hasChatMessages(aptId: string): Promise<boolean> {
  try {
    const snap = await adminDb
      .ref(`doza/chats/${aptId}/messages`)
      .limitToFirst(1)
      .once("value");
    return snap.exists();
  } catch {
    return false;
  }
}

/** Map a raw stored appointment into the UI shape the panel expects. */
function toUiAppointment(raw: any, now: number, hasMessages: boolean) {
  const startMs = raw.scheduledAt
    ? new Date(raw.scheduledAt).getTime()
    : new Date(`${raw.date}T${raw.time}`).getTime();
  const durationMins =
    raw.durationMinutes ?? Math.round(parseDurationToMs(raw.duration) / 60_000);
  const endMs = computeEndMs(startMs, raw.duration, durationMins);

  const type: "video" | "in-person" | "home" =
    raw.type === "video" || raw.type === "home"
      ? raw.type
      : raw.consultType === "online"
        ? "video"
        : raw.address
          ? "home"
          : "in-person";

  return {
    id: raw.id,
    patientId: raw.patientId ?? null,
    patientName: raw.patientName || "Patient",
    patientAge: raw.patientAge ?? null,
    patientProfileImage: raw.patientProfileImage ?? null,

    type,
    status: deriveUiStatus(raw.status, startMs, endMs, now),
    storedStatus: raw.status,

    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    durationMinutes: durationMins,

    reason: raw.reason || "",
    location: raw.address || raw.location || undefined,

    consultType: raw.consultType ?? "online",
    amount: raw.amount ?? null,
    paymentReference: raw.paymentReference ?? null,
    rating: raw.rating ?? null,
    comment: raw.comment ?? null,

    source: raw.source ?? "patient_booking",
    hasMessages,
    createdAt: raw.createdAt,
  };
}

// ─── GET — medic's appointment list ──────────────────
export async function GET(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const snap = await adminDb
      .ref(`${MEDICS_NODE}/${uid}/appointments`)
      .once("value");
    const val = snap.val();
    const raw = val ? (Array.isArray(val) ? val : Object.values(val)) : [];

    const now = Date.now();
    const enriched = await Promise.all(
      (raw as any[]).map(async (apt) => {
        if (!apt?.id) return null;
        // Only hit the chat node for appointments that actually have a chat
        // (i.e. patient bookings). Medic-created appointments have no chat.
        const hasMsgs =
          apt.source === "patient_booking"
            ? await hasChatMessages(apt.id)
            : false;
        return toUiAppointment(apt, now, hasMsgs);
      }),
    );

    return NextResponse.json({
      success: true,
      data: enriched.filter(Boolean),
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic appointments failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load appointments" },
      { status: 500 },
    );
  }
}

// ─── POST — medic creates their own appointment ──────
export async function POST(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid appointment data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const [h, m] = d.time.split(":").map(Number);
    const [y, mo, day] = d.date.split("-").map(Number);
    const start = new Date(y, mo - 1, day, h, m, 0, 0);
    const startMs = start.getTime();
    const endMs = startMs + d.durationMinutes * 60_000;
    const now = Date.now();

    // If the medic picked a time that's already in the past, store it as
    // completed so it doesn't flash as "upcoming" for a split second.
    const storedStatus =
      now >= endMs ? "completed" : now >= startMs ? "ongoing" : "upcoming";

    const aptId = `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id: aptId,
      patientId: null,
      patientName: d.patientName.trim(),
      patientAge: d.patientAge ?? null,
      patientProfileImage: null,

      date: d.date,
      time: d.time,
      scheduledAt: start.toISOString(),
      durationMinutes: d.durationMinutes,
      duration: `${d.durationMinutes} min`,

      type: d.type,
      consultType:
        d.type === "video" ? "online" : ("inPerson" as "online" | "inPerson"),
      address: d.type === "home" ? d.location || null : null,

      reason: d.reason.trim(),
      amount: null,
      paymentReference: null,

      status: storedStatus,
      createdAt: new Date().toISOString(),
      source: "medic_created",
    };

    const ref = adminDb.ref(`${MEDICS_NODE}/${uid}/appointments`);
    const snap = await ref.once("value");
    const val = snap.val();
    const existing = val ? (Array.isArray(val) ? val : Object.values(val)) : [];
    (existing as any[]).push(record);
    await ref.set(existing);

    return NextResponse.json(
      {
        success: true,
        data: toUiAppointment(record, now, false),
      },
      { status: 201 },
    );
  } catch (err: any) {
    logger.error({
      uid,
      message: "POST medic appointment failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to create appointment" },
      { status: 500 },
    );
  }
}
