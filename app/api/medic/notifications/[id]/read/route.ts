// app/api/medic/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const ref = adminDb.ref(`${MEDICS_NODE}/${uid}/notifications/${id}`);
    const snap = await ref.once("value");
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 },
      );
    }
    await ref.update({ read: true, readAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error({
      uid,
      id,
      message: "POST mark notification read failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to mark read" },
      { status: 500 },
    );
  }
}
