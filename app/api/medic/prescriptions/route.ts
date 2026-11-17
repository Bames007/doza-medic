// app/api/medic/prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

/**
 * GET /api/medic/prescriptions
 *
 * Aggregates every prescription the medic has ever sent through chat.
 * Reads the medic's appointments, then each appointment's chat messages,
 * filters to `mediaType === "prescription"`, and returns newest first.
 */
export async function GET(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = Math.min(
    200,
    Math.max(20, Number(url.searchParams.get("limit")) || 100),
  );

  try {
    const aptsSnap = await adminDb
      .ref(`${MEDICS_NODE}/${uid}/appointments`)
      .once("value");
    const val = aptsSnap.val();
    const apts = val ? (Array.isArray(val) ? val : Object.values(val)) : [];

    const aptById = new Map<string, any>();
    for (const a of apts as any[]) {
      if (a?.id) aptById.set(a.id, a);
    }

    // Fetch all prescription messages across every chat in parallel.
    const perAppointment = await Promise.all(
      Array.from(aptById.values()).map(async (apt) => {
        try {
          const snap = await adminDb
            .ref(`doza/chats/${apt.id}/messages`)
            .once("value");
          const msgVal = snap.val();
          if (!msgVal) return [] as any[];

          const messages = Object.entries(msgVal).map(
            ([k, m]: [string, any]) => ({ ...m, id: m?.id || k }),
          );
          return messages
            .filter(
              (m) =>
                m.mediaType === "prescription" &&
                m.senderRole === "medic" &&
                m.prescriptionData,
            )
            .map((m) => ({
              id: m.id,
              appointmentId: apt.id,
              patientId: apt.patientId ?? apt.patientUid ?? null,
              patientName: apt.patientName || "Patient",
              patientProfileImage: apt.patientProfileImage ?? null,
              createdAt: m.createdAt || null,
              instructions: m.prescriptionData.instructions || "",
              drugs: m.prescriptionData.drugs || [],
              appointmentReason: apt.reason || "",
            }));
        } catch {
          return [] as any[];
        }
      }),
    );

    const all = (perAppointment.flat() as any[])
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, limit);

    // Stats
    const now = Date.now();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).getTime();
    const thisMonth = all.filter(
      (p) => (p.createdAt || 0) >= monthStart,
    ).length;

    const uniquePatients = new Set(all.map((p) => p.patientId).filter(Boolean));

    return NextResponse.json({
      success: true,
      data: {
        prescriptions: all,
        stats: {
          total: all.length,
          thisMonth,
          uniquePatients: uniquePatients.size,
        },
        generatedAt: now,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic prescriptions failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load prescriptions" },
      { status: 500 },
    );
  }
}
