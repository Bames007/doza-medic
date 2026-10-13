// app/api/medic/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Stateless demo token — nothing to revoke server-side yet.
  return NextResponse.json({ success: true });
}
