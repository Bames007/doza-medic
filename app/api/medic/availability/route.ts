// app/api/medic/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import { z } from "zod";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const HHMM = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
const STATUSES = ["online", "away", "offline", "on-leave"] as const;

// 30 min without updates → treat online as away
const ONLINE_STALE_MS = 30 * 60 * 1000;

const patchSchema = z
  .object({
    status: z.enum(STATUSES).optional(),

    // availability
    days: z.array(z.enum(DAYS)).max(7).optional(),
    hours: z
      .object({
        start: z.string().regex(HHMM, "Invalid start time"),
        end: z.string().regex(HHMM, "Invalid end time"),
      })
      .optional(),
    breakTime: z
      .object({
        start: z.string().regex(HHMM, "Invalid break start"),
        end: z.string().regex(HHMM, "Invalid break end"),
      })
      .nullable()
      .optional(),

    emergencyAvailable: z.boolean().optional(),
    emergencyPremium: z.number().min(0).max(1_000_000).optional(),

    instantTalk: z.boolean().optional(),
    instantTalkWindowMinutes: z.number().int().min(5).max(120).optional(),
    instantTalkPremium: z.number().min(0).max(1_000_000).optional(),

    maxPerDay: z.number().int().min(1).max(50).optional(),
    bufferMinutes: z.number().int().min(0).max(120).optional(),
    advanceBookingDays: z.number().int().min(1).max(90).optional(),

    timezone: z.string().min(1).max(64).optional(),
  })
  .strict();

const DEFAULTS = {
  days: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
  hours: { start: "09:00", end: "17:00" },
  breakTime: null as { start: string; end: string } | null,
  emergencyAvailable: false,
  emergencyPremium: 0,
  instantTalk: false,
  instantTalkWindowMinutes: 15,
  instantTalkPremium: 0,
  maxPerDay: 12,
  bufferMinutes: 10,
  advanceBookingDays: 30,
  timezone: "Africa/Lagos",
};

function normalizeAvailability(raw: any) {
  const a = raw?.availability || {};
  const days = Array.isArray(a.days) && a.days.length ? a.days : DEFAULTS.days;
  return {
    days,
    hours: {
      start: a.hours?.start || DEFAULTS.hours.start,
      end: a.hours?.end || DEFAULTS.hours.end,
    },
    breakTime: a.breakTime || null,
    emergencyAvailable: a.emergencyAvailable === true,
    emergencyPremium: Number(a.emergencyPremium) || 0,
    instantTalk: a.instantTalk === true,
    instantTalkWindowMinutes:
      Number(a.instantTalkWindowMinutes) || DEFAULTS.instantTalkWindowMinutes,
    instantTalkPremium: Number(a.instantTalkPremium) || 0,
    maxPerDay: Number(a.maxPerDay) || DEFAULTS.maxPerDay,
    bufferMinutes:
      a.bufferMinutes === 0
        ? 0
        : Number(a.bufferMinutes) || DEFAULTS.bufferMinutes,
    advanceBookingDays:
      Number(a.advanceBookingDays) || DEFAULTS.advanceBookingDays,
    timezone: a.timezone || DEFAULTS.timezone,
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

    const rawStatus = (val.status as string) || "offline";
    const statusUpdatedAt = val.statusUpdatedAt || null;

    const isStale =
      rawStatus === "online" &&
      (!statusUpdatedAt ||
        Date.now() - new Date(statusUpdatedAt).getTime() > ONLINE_STALE_MS);

    return NextResponse.json({
      success: true,
      data: {
        availability: normalizeAvailability(val.practiceInfo || {}),
        status: rawStatus,
        effectiveStatus: isStale ? "away" : rawStatus,
        statusUpdatedAt,
        isStale,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic availability failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load availability" },
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
          error: "Invalid availability data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const patch = parsed.data;

    // Business rule: instant talk requires online status
    if (patch.instantTalk === true && patch.status === "offline") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot enable instant talk while offline",
        },
        { status: 400 },
      );
    }

    // Time consistency
    if (patch.hours && patch.hours.start >= patch.hours.end) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 },
      );
    }
    if (patch.breakTime) {
      if (patch.breakTime.start >= patch.breakTime.end) {
        return NextResponse.json(
          { success: false, error: "Break end must be after break start" },
          { status: 400 },
        );
      }
      if (patch.hours) {
        if (
          patch.breakTime.start < patch.hours.start ||
          patch.breakTime.end > patch.hours.end
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Break must fall inside your working hours",
            },
            { status: 400 },
          );
        }
      }
    }

    const snap = await adminDb.ref(`${MEDICS_NODE}/${uid}`).once("value");
    const val = snap.val() || {};
    const practiceInfo = val.practiceInfo || {};
    const existingAvail = practiceInfo.availability || {};
    const existingStatus = (val.status as string) || "offline";

    const availabilityFields = [
      "days",
      "hours",
      "breakTime",
      "emergencyAvailable",
      "emergencyPremium",
      "instantTalk",
      "instantTalkWindowMinutes",
      "instantTalkPremium",
      "maxPerDay",
      "bufferMinutes",
      "advanceBookingDays",
      "timezone",
    ] as const;

    const updates: Record<string, any> = {};
    const nextAvail = { ...existingAvail };

    for (const key of availabilityFields) {
      if (patch[key] !== undefined) {
        nextAvail[key] = patch[key];
        updates[`practiceInfo/availability/${key}`] = patch[key];
      }
    }

    const nextStatus = patch.status ?? existingStatus;
    if (patch.status !== undefined) {
      updates.status = nextStatus;
      updates.statusUpdatedAt = new Date().toISOString();
    }

    if (
      patch.status !== undefined &&
      patch.status !== "online" &&
      existingAvail.instantTalk === true
    ) {
      nextAvail.instantTalk = false;
      updates[`practiceInfo/availability/instantTalk`] = false;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          availability: normalizeAvailability({ availability: nextAvail }),
          status: nextStatus,
          effectiveStatus: nextStatus,
          statusUpdatedAt: val.statusUpdatedAt || null,
          isStale: false,
        },
      });
    }

    await adminDb.ref(`${MEDICS_NODE}/${uid}`).update(updates);

    const freshSnap = await adminDb.ref(`${MEDICS_NODE}/${uid}`).once("value");
    const fresh = freshSnap.val() || {};

    return NextResponse.json({
      success: true,
      data: {
        availability: normalizeAvailability(fresh.practiceInfo || {}),
        status: fresh.status || "offline",
        effectiveStatus: fresh.status || "offline",
        statusUpdatedAt: fresh.statusUpdatedAt || null,
        isStale: false,
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "PATCH medic availability failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to save availability" },
      { status: 500 },
    );
  }
}

// ⬇ NEW — alias so client-side authPut() (which sends PUT) works
export async function PUT(request: NextRequest) {
  return PATCH(request);
}
