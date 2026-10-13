// app/api/medic/login/route.ts
import { NextResponse } from "next/server";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { auth, app } from "@/app/utils/firebaseConfig";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    let uid: string;
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      uid = cred.user.uid;
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password." },
          { status: 401 },
        );
      }
      throw err;
    }

    const db = getDatabase(app);
    const snap = await get(ref(db, `doza_medics/${uid}`));

    if (!snap.exists()) {
      await signOut(auth);
      return NextResponse.json(
        {
          success: false,
          error:
            "No Doza Medic profile linked to this account. Please register first.",
        },
        { status: 404 },
      );
    }

    const r = snap.val();

    // 3. Build the safe medic object (no password, obviously)
    const medic = {
      id: uid,
      email: r.personalInfo.email,
      firstName: r.personalInfo.firstName,
      lastName: r.personalInfo.lastName,
      fullName: `${r.personalInfo.firstName} ${r.personalInfo.lastName}`.trim(),
      phone: r.personalInfo.phone,
      gender: r.personalInfo.gender,
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
      profileComplete: !!r.profileComplete,
    };

    // 4. Sign out from the server-side SDK so we don't hold a session there
    await signOut(auth);

    return NextResponse.json({ success: true, medic });
  } catch (err) {
    console.error("[medic/login]", err);
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}
