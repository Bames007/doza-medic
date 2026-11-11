import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/utils/firebaseAdmin";
import { z } from "zod";
import logger from "@/app/utils/logger";

const schema = z.object({ idToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { idToken } = schema.parse(await req.json());

    const decoded = await adminAuth.verifyIdToken(idToken);

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

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

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
      message: "Medic login cookie failed",
      error: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 401 },
    );
  }
}
