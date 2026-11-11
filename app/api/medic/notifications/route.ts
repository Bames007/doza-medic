// app/api/medic/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

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
      .ref(`${MEDICS_NODE}/${uid}/notifications`)
      .once("value");
    const val = snap.val();
    const list = (
      val ? (Array.isArray(val) ? val : Object.values(val)) : []
    ) as any[];

    list.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

    const unread = list.filter((n) => !n.read).length;
    return NextResponse.json({
      success: true,
      data: { notifications: list.slice(0, 50), unread },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic notifications failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load notifications" },
      { status: 500 },
    );
  }
}
