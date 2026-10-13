// app/api/medic/me/route.ts
import { NextResponse } from "next/server";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/app/utils/firebaseConfig";
import type { MedicUser } from "@/app/dashboard/type/type";

function parseToken(token: string): { medicId: string } | null {
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const header = req.headers.get("authorization") ?? "";
    if (!header.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const payload = parseToken(header.slice(7));
    if (!payload?.medicId) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const db = getDatabase(app);
    const snap = await get(ref(db, `doza_medics/${payload.medicId}`));
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Medic not found" },
        { status: 404 },
      );
    }

    const r = snap.val();
    const medic: MedicUser = {
      id: payload.medicId,
      email: r.personalInfo.email,
      firstName: r.personalInfo.firstName,
      lastName: r.personalInfo.lastName,
      gender: r.personalInfo.gender,
      fullName: `${r.personalInfo.firstName} ${r.personalInfo.lastName}`.trim(),
      phone: r.personalInfo.phone,
      profilePhoto: r.personalInfo.profilePhoto ?? null,
      professionalRole: r.professionalInfo?.role,
      specialties: r.professionalInfo?.specialties ?? [],
      licenseNumber: r.professionalInfo?.licenseNumber,
      yearsOfExperience: r.professionalInfo?.yearsOfExperience,
      consultationTypes: r.practiceInfo?.consultationTypes ?? {
        inPerson: true,
        online: false,
        homeVisit: false,
      },
      hourlyRate: r.practiceInfo?.hourlyRate,
      availability: r.practiceInfo?.availability,
      location: r.location,
      verified: !!r.verified,
      status: r.status ?? "pending",
    };

    return NextResponse.json({ success: true, medic });
  } catch (err) {
    console.error("[medic/me]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
