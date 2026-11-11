// app/api/medic/notifications/read-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

export async function POST(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const snap = await adminDb
      .ref(`${MEDICS_NODE}/${uid}/notifications`)
      .once("value");
    const val = snap.val();
    if (!val) return NextResponse.json({ success: true, count: 0 });

    const entries = Object.entries(val) as [string, any][];
    const updates: Record<string, any> = {};
    const now = new Date().toISOString();
    let count = 0;

    for (const [id, n] of entries) {
      if (n.read === false) {
        updates[`${id}/read`] = true;
        updates[`${id}/readAt`] = now;
        count++;
      }
    }

    if (count > 0) {
      await adminDb.ref(`${MEDICS_NODE}/${uid}/notifications`).update(updates);
    }

    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    logger.error({
      uid,
      message: "POST mark all notifications read failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to mark all read" },
      { status: 500 },
    );
  }
}
