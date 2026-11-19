// app/api/medic/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import { z } from "zod";
import logger from "@/app/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// ─── Chat info: meta (patientId) + last message ──────
type LastMessageInfo = {
  at: number;
  senderRole: "patient" | "medic";
  preview: string;
} | null;

function buildLastMessageInfo(msg: any): LastMessageInfo {
  if (!msg?.createdAt) return null;
  const preview = msg.text?.trim()
    ? msg.text.trim().slice(0, 80)
    : msg.mediaType === "image"
      ? "📷 Photo"
      : msg.mediaType === "voice"
        ? "🎤 Voice note"
        : msg.mediaType === "pdf"
          ? "📄 Document"
          : msg.mediaType === "prescription"
            ? "💊 Prescription"
            : msg.mediaType === "tests"
              ? "🧪 Lab tests"
              : msg.mediaType === "note"
                ? "📝 Clinical note"
                : "New message";

  return {
    at: msg.createdAt,
    senderRole: msg.senderRole === "medic" ? "medic" : "patient",
    preview,
  };
}

async function getChatInfo(aptId: string): Promise<{
  patientId: string | null;
  lastMessage: LastMessageInfo;
}> {
  try {
    const [metaSnap, msgSnap] = await Promise.all([
      adminDb.ref(`doza/chats/${aptId}/meta`).once("value"),
      adminDb
        .ref(`doza/chats/${aptId}/messages`)
        .orderByKey()
        .limitToLast(1)
        .once("value"),
    ]);

    const meta = metaSnap.val();
    const msgVal = msgSnap.val();
    const msg = msgVal ? (Object.values(msgVal)[0] as any) : null;

    return {
      patientId: meta?.patientId || null,
      lastMessage: buildLastMessageInfo(msg),
    };
  } catch {
    return { patientId: null, lastMessage: null };
  }
}

/** Pick the first available patient id from any known field name. */
function resolvePatientId(
  raw: any,
  chatPatientId: string | null,
): string | null {
  if (!raw) return chatPatientId;
  const candidates = [
    raw.patientId,
    raw.patientUserId,
    raw.userId,
    raw.customerId,
    raw.clientId,
    raw.bookedById,
    raw.accountId,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return chatPatientId;
}

function toUiAppointment(
  raw: any,
  now: number,
  lastMsg: LastMessageInfo,
  patientId: string | null,
) {
  const startMs = raw.scheduledAt
    ? new Date(raw.scheduledAt).getTime()
    : raw.date && raw.time
      ? new Date(`${raw.date}T${raw.time}`).getTime()
      : now;

  const endMs = computeEndMs(startMs, raw.duration, raw.durationMinutes);

  const storedStatus = raw.status || "upcoming";
  const uiStatus = deriveUiStatus(storedStatus, startMs, endMs, now);

  return {
    id: raw.id,
    patientId: patientId ?? null,
    patientName: raw.patientName ?? "Patient",
    patientAge: raw.patientAge ?? null,
    patientProfileImage: raw.patientProfileImage ?? null,
    type: raw.type ?? "video",
    status: uiStatus,
    storedStatus,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    durationMinutes: Math.round((endMs - startMs) / 60_000),
    reason: raw.reason ?? "",
    location: raw.location ?? undefined,
    consultType: raw.consultType === "inPerson" ? "inPerson" : "online",
    amount: raw.amount ?? null,
    paymentReference: raw.paymentReference ?? null,
    rating: raw.rating ?? null,
    comment: raw.comment ?? null,
    source:
      raw.source === "patient_booking" ? "patient_booking" : "medic_created",
    hasMessages: !!lastMsg,
    lastMessageAt: lastMsg?.at ?? null,
    lastMessageSenderRole: lastMsg?.senderRole ?? null,
    lastMessagePreview: lastMsg?.preview ?? null,
    createdAt: raw.createdAt ?? new Date(startMs).toISOString(),
  };
}

// ─── GET ─────────────────────────────────────────────
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
    if (!val) {
      return NextResponse.json({ success: true, data: [] });
    }

    const rawList: any[] = Array.isArray(val)
      ? val
      : Object.entries(val).map(([k, v]: any) => ({
          ...(v as any),
          id: (v as any)?.id || k,
        }));

    // Fetch chat meta + last message for every appointment in parallel.
    const chatInfos = await Promise.all(
      rawList.map((r) =>
        r?.id
          ? getChatInfo(r.id)
          : Promise.resolve({
              patientId: null as string | null,
              lastMessage: null as LastMessageInfo,
            }),
      ),
    );

    const now = Date.now();
    const data = rawList.map((r, i) => {
      const info = chatInfos[i];
      const patientId = resolvePatientId(r, info.patientId);
      return toUiAppointment(r, now, info.lastMessage, patientId);
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET /api/medic/appointments failed",
      errorMessage: err?.message,
      errorStack: err?.stack,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load appointments" },
      { status: 500 },
    );
  }
}

// ─── POST (unchanged) ─────────────────────────────────
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
          error: "Invalid appointment",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const now = Date.now();
    const id = `apt-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const startMs = new Date(
      `${parsed.data.date}T${parsed.data.time}`,
    ).getTime();
    const endMs = startMs + parsed.data.durationMinutes * 60_000;

    const appointment = {
      id,
      patientName: parsed.data.patientName,
      patientAge: parsed.data.patientAge ?? null,
      type: parsed.data.type,
      status: "upcoming",
      scheduledAt: new Date(startMs).toISOString(),
      date: parsed.data.date,
      time: parsed.data.time,
      duration: `${parsed.data.durationMinutes} min`,
      durationMinutes: parsed.data.durationMinutes,
      reason: parsed.data.reason,
      location: parsed.data.location ?? null,
      consultType: parsed.data.type === "video" ? "online" : "inPerson",
      amount: null,
      paymentReference: null,
      rating: null,
      comment: null,
      source: "medic_created",
      createdAt: new Date(now).toISOString(),
    };

    await adminDb
      .ref(`${MEDICS_NODE}/${uid}/appointments/${id}`)
      .set(appointment);

    return NextResponse.json(
      {
        success: true,
        data: toUiAppointment(appointment, now, null, null),
      },
      { status: 201 },
    );
  } catch (err: any) {
    logger.error({
      uid,
      message: "POST /api/medic/appointments failed",
      errorMessage: err?.message,
      errorStack: err?.stack,
    });
    return NextResponse.json(
      { success: false, error: "Unable to create appointment" },
      { status: 500 },
    );
  }
}
