// app/api/medic/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import { z } from "zod";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

const serviceSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  description: z.string().max(300).default(""),
  durationMinutes: z.number().int().min(5).max(240),
  price: z.number().min(0).max(10_000_000),
  type: z.enum(["video", "in-person", "home", "any"]),
  active: z.boolean(),
});

const patchSchema = z
  .object({
    hourlyRate: z.number().min(0).max(10_000_000).optional(),
    consultationTypes: z
      .object({
        inPerson: z.boolean(),
        online: z.boolean(),
        homeVisit: z.boolean(),
      })
      .optional(),
    pricing: z
      .object({
        inPersonRate: z.number().min(0).max(10_000_000).optional(),
        onlineRate: z.number().min(0).max(10_000_000).optional(),
        homeVisitRate: z.number().min(0).max(10_000_000).optional(),
        homeVisitFee: z.number().min(0).max(1_000_000).optional(),
        urgentFee: z.number().min(0).max(1_000_000).optional(),
        followUpDiscountPct: z.number().int().min(0).max(100).optional(),
      })
      .optional(),
    services: z.array(serviceSchema).max(20).optional(),
  })
  .strict();

function normalizePracticeInfo(pi: any) {
  const pricing = pi?.pricing || {};
  const services = Array.isArray(pi?.services) ? pi.services : [];

  return {
    hourlyRate: Number(pi?.hourlyRate) || 0,
    consultationTypes: {
      inPerson: pi?.consultationTypes?.inPerson !== false,
      online: pi?.consultationTypes?.online === true,
      homeVisit: pi?.consultationTypes?.homeVisit === true,
    },
    pricing: {
      inPersonRate: Number(pricing.inPersonRate) || 0,
      onlineRate: Number(pricing.onlineRate) || 0,
      homeVisitRate: Number(pricing.homeVisitRate) || 0,
      homeVisitFee: Number(pricing.homeVisitFee) || 0,
      urgentFee: Number(pricing.urgentFee) || 0,
      followUpDiscountPct: Number(pricing.followUpDiscountPct) || 0,
    },
    services: services.map((s: any) => ({
      id: s.id,
      name: s.name || "",
      description: s.description || "",
      durationMinutes: Number(s.durationMinutes) || 30,
      price: Number(s.price) || 0,
      type: s.type || "any",
      active: s.active !== false,
    })),
  };
}

export async function GET(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const snap = await adminDb.ref(`${MEDICS_NODE}/${uid}`).once("value");
    const val = snap.val() || {};
    return NextResponse.json({
      success: true,
      data: normalizePracticeInfo(val.practiceInfo || {}),
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic services failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load services" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid services data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const patch = parsed.data;

    if (
      patch.consultationTypes &&
      !patch.consultationTypes.inPerson &&
      !patch.consultationTypes.online &&
      !patch.consultationTypes.homeVisit
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one consultation type must be enabled",
        },
        { status: 400 },
      );
    }

    if (patch.services) {
      const ids = new Set<string>();
      for (const s of patch.services) {
        if (ids.has(s.id)) {
          return NextResponse.json(
            { success: false, error: "Duplicate service ID" },
            { status: 400 },
          );
        }
        ids.add(s.id);
      }
      const activeCount = patch.services.filter((s) => s.active).length;
      if (patch.services.length > 0 && activeCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "At least one service must be active (or remove all)",
          },
          { status: 400 },
        );
      }
    }

    const snap = await adminDb.ref(`${MEDICS_NODE}/${uid}`).once("value");
    const val = snap.val() || {};
    const existing = val.practiceInfo || {};

    const updates: Record<string, any> = {};

    if (patch.hourlyRate !== undefined) {
      updates["practiceInfo/hourlyRate"] = patch.hourlyRate;
    }

    if (patch.consultationTypes !== undefined) {
      updates["practiceInfo/consultationTypes"] = patch.consultationTypes;
    }

    if (patch.pricing !== undefined) {
      const merged = { ...(existing.pricing || {}), ...patch.pricing };
      updates["practiceInfo/pricing"] = merged;
    }

    if (patch.services !== undefined) {
      updates["practiceInfo/services"] = patch.services;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        data: normalizePracticeInfo(existing),
      });
    }

    await adminDb.ref(`${MEDICS_NODE}/${uid}`).update(updates);

    const freshSnap = await adminDb.ref(`${MEDICS_NODE}/${uid}`).once("value");
    const fresh = freshSnap.val() || {};

    return NextResponse.json({
      success: true,
      data: normalizePracticeInfo(fresh.practiceInfo || {}),
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "PATCH medic services failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to save services" },
      { status: 500 },
    );
  }
}

// ⬇ NEW — alias so client-side authPut() (which sends PUT) works
export async function PUT(request: NextRequest) {
  return PATCH(request);
}
