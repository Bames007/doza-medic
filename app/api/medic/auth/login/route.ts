// app/api/medic/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/utils/firebaseAdmin";
import { z } from "zod";
import logger from "@/app/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ idToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "idToken is required",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { idToken } = parsed.data;

    // 1. Verify the Firebase ID token
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (err: any) {
      logger.warn({
        message: "verifyIdToken failed",
        code: err?.code,
        error: err?.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired ID token",
          code: err?.code ?? null,
        },
        { status: 401 },
      );
    }

    // 2. Read the medic record
    const snap = await adminDb.ref(`doza_medics/${decoded.uid}`).once("value");
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Not a medic account" },
        { status: 403 },
      );
    }

    const r = snap.val();
    if (r.status === "suspended" || r.status === "rejected") {
      return NextResponse.json(
        { success: false, error: `Account ${r.status}` },
        { status: 403 },
      );
    }

    // 3. Create the session cookie
    const expiresIn = 1000 * 60 * 60 * 24 * 5; // 5 days in ms
    let sessionCookie: string;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
      });
    } catch (err: any) {
      logger.error({
        message: "createSessionCookie failed",
        code: err?.code,
        error: err?.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Session creation failed",
          code: err?.code ?? null,
        },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (err: any) {
    logger.error({
      message: "Medic login unexpected failure",
      error: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "production"
            ? "Login failed"
            : err?.message || "Login failed",
        // In production, this stays generic. In dev, you see the real error.
      },
      { status: 500 },
    );
  }
}
