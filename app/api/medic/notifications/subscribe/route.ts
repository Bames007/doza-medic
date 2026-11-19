// app/api/medic/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function endpointKey(endpoint: string): string {
  return Buffer.from(endpoint).toString("base64url").slice(0, 64);
}

export async function POST(req: NextRequest) {
  const uid = await verifySessionCookie(req);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sub = body?.subscription;
    const role = body?.role;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription" },
        { status: 400 },
      );
    }
    if (role !== "medic" && role !== "patient") {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    const key = endpointKey(sub.endpoint);
    await adminDb.ref(`doza_push_subscriptions/${uid}/${key}`).set({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      role,
      userId: uid,
      userAgent: req.headers.get("user-agent") || null,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({
      uid,
      message: "push subscribe failed",
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const uid = await verifySessionCookie(req);
  if (!uid) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const endpoint = body?.endpoint;
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "endpoint required" },
        { status: 400 },
      );
    }

    await adminDb
      .ref(`doza_push_subscriptions/${uid}/${endpointKey(endpoint)}`)
      .remove();

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({
      uid,
      message: "push unsubscribe failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
