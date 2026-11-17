// app/api/medic/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/app/utils/auth";
import { adminDb } from "@/app/utils/firebaseAdmin";
import logger from "@/app/utils/logger";

const MEDICS_NODE = "doza_medics";

/**
 * GET /api/medic/conversations
 *
 * Walks the medic's appointment list, then for each appointment
 * checks whether a chat exists and pulls the last message + unread
 * info. Uses Promise.all so latency is the slowest appointment,
 * not the sum of all of them.
 */
export async function GET(request: NextRequest) {
  const uid = await verifySessionCookie(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const aptsSnap = await adminDb
      .ref(`${MEDICS_NODE}/${uid}/appointments`)
      .once("value");
    const val = aptsSnap.val();
    const apts = val ? (Array.isArray(val) ? val : Object.values(val)) : [];

    const metaSnap = await adminDb
      .ref(`doza/medic_chat_meta/${uid}`)
      .once("value");
    const metaMap = (metaSnap.val() || {}) as Record<string, any>;

    // Parallel fetch: for each appointment, if a chat exists, grab last message.
    const conversations = await Promise.all(
      (apts as any[])
        .filter((a) => a?.id)
        .map(async (apt: any) => {
          const chatRef = adminDb.ref(`doza/chats/${apt.id}`);

          let lastMessage: any = null;
          let messageCount = 0;
          try {
            const [lastSnap, countSnap] = await Promise.all([
              chatRef
                .child("messages")
                .orderByKey()
                .limitToLast(1)
                .once("value"),
              chatRef
                .child("messages")
                .once("value")
                .then((s) => ({
                  exists: s.exists(),
                  size: s.exists() ? Object.keys(s.val()).length : 0,
                })),
            ]);

            if (lastSnap.exists()) {
              const entries = Object.entries(lastSnap.val() as any);
              const [key, m] = entries[0];
              lastMessage = { ...(m as any), id: (m as any)?.id || key };
            }
            messageCount = countSnap.size;
          } catch {
            // Non-fatal — appointment may not have a chat yet
          }

          if (!lastMessage) return null;

          const meta = metaMap[apt.id] || null;
          const lastSeenAt = meta?.medicLastSeenAt ?? 0;
          const lastMessageMs = Number(lastMessage.createdAt || 0);
          const unread =
            lastMessage.senderRole === "patient" && lastMessageMs > lastSeenAt;

          return {
            appointmentId: apt.id,
            patientId: apt.patientId ?? apt.patientUid ?? null,
            patientName: apt.patientName || "Patient",
            patientProfileImage: apt.patientProfileImage ?? null,

            appointmentStatus: apt.status || "upcoming",
            scheduledAt: apt.scheduledAt || null,
            consultType: apt.consultType || "online",
            durationLabel: apt.duration || "60 min",
            reason: apt.reason || "",

            lastMessageText:
              lastMessage.text?.trim() ||
              (lastMessage.mediaType === "prescription"
                ? "[Prescription]"
                : lastMessage.mediaType === "tests"
                  ? "[Test request]"
                  : lastMessage.mediaType === "note"
                    ? "[Note]"
                    : lastMessage.mediaType === "pdf"
                      ? "[PDF]"
                      : lastMessage.mediaType === "image"
                        ? "[Photo]"
                        : lastMessage.mediaType === "voice"
                          ? "[Voice note]"
                          : "[Message]"),
            lastMessageAt: lastMessageMs || null,
            lastSenderRole: lastMessage.senderRole,
            messageCount,
            unread,
          };
        }),
    );

    const filtered = conversations.filter(Boolean) as any[];
    filtered.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    const totalUnread = filtered.filter((c) => c.unread).length;

    return NextResponse.json({
      success: true,
      data: {
        conversations: filtered,
        stats: {
          total: filtered.length,
          unread: totalUnread,
        },
      },
    });
  } catch (err: any) {
    logger.error({
      uid,
      message: "GET medic conversations failed",
      errorMessage: err?.message,
    });
    return NextResponse.json(
      { success: false, error: "Unable to load conversations" },
      { status: 500 },
    );
  }
}
