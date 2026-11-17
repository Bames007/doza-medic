// app/medic/dashboard/panels/MessagesPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  Send,
  Loader2,
  ShieldAlert,
  RotateCw,
  Clock,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { authPost } from "@/app/utils/client-auth";
import {
  useMedicConversations,
  useChatThread,
  type Conversation,
  type ChatMessage,
} from "../hooks/useMedicConversations";

function fmtRelative(ms: number | null): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString();
}

export default function MessagesPanel() {
  const { conversations, stats, isLoading, error, mutate } =
    useMedicConversations();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const filtered = conversations.filter((c) => {
    if (onlyUnread && !c.unread) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      c.lastMessageText.toLowerCase().includes(q)
    );
  });

  if (activeId) {
    return (
      <ChatThread
        appointmentId={activeId}
        onBack={() => {
          setActiveId(null);
          mutate();
        }}
      />
    );
  }

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      <div className="px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Inbox
            </p>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-none mt-1",
                bebasNeue.className,
              )}
            >
              MESSAGES
            </h1>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <button
            onClick={() => setOnlyUnread(false)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors",
              !onlyUnread
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-200",
            )}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setOnlyUnread(true)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors",
              onlyUnread
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-200",
            )}
          >
            Unread ({stats.unread})
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 mt-6 max-w-3xl">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient or message…"
            className="w-full pl-9 pr-9 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-8 mt-6 max-w-3xl">
        {error && (
          <div className="flex items-start gap-2 p-4 mb-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Could not load messages. Try refreshing.</span>
          </div>
        )}

        {isLoading && conversations.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={24} />
            </div>
            <p className="font-bold text-slate-900">
              {query || onlyUnread ? "No matches" : "No conversations yet"}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {query || onlyUnread
                ? "Try a different filter."
                : "Patient chats will appear here after their first booking."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
            {filtered.map((c) => (
              <button
                key={c.appointmentId}
                onClick={() => setActiveId(c.appointmentId)}
                className="w-full text-left flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                  {c.patientProfileImage ? (
                    <img
                      src={c.patientProfileImage}
                      alt={c.patientName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    c.patientName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm truncate",
                        c.unread
                          ? "font-black text-slate-900"
                          : "font-bold text-slate-700",
                      )}
                    >
                      {c.patientName}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                      {fmtRelative(c.lastMessageAt)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate mt-0.5",
                      c.unread
                        ? "text-slate-700 font-semibold"
                        : "text-slate-500",
                    )}
                  >
                    {c.lastSenderRole === "medic" && (
                      <span className="text-slate-400">You: </span>
                    )}
                    {c.lastMessageText}
                  </p>
                </div>
                {c.unread && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat thread — the fix for "forever loading" ─────
function ChatThread({
  appointmentId,
  onBack,
}: {
  appointmentId: string;
  onBack: () => void;
}) {
  const {
    chat,
    messages,
    meta,
    role,
    isLoading,
    timedOut,
    error,
    isNotFound,
    isForbidden,
    isServerError,
    hasEnded,
    mutate,
  } = useChatThread(appointmentId);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await authPost(
        `/api/appointments/${appointmentId}/messages`,
        { text: trimmed },
      );
      if (res.success) {
        setText("");
        await mutate();
      } else {
        setSendError(res.error || "Message failed to send");
      }
    } catch (e: any) {
      setSendError("Network error — please retry.");
    } finally {
      setSending(false);
    }
  };

  // 🔴 The three explicit error branches prevent the "forever
  // loading" loop the old panel had. Each case gives the user a
  // clear path forward.
  if (isLoading) {
    return <ChatSkeleton onBack={onBack} />;
  }

  if (isNotFound) {
    return (
      <ChatErrorState
        onBack={onBack}
        title="Chat not available"
        body="This conversation could not be found. The patient may have cancelled, or the booking is still syncing."
        cta="Retry"
        onCta={() => mutate()}
      />
    );
  }

  if (isForbidden) {
    return (
      <ChatErrorState
        onBack={onBack}
        title="Access denied"
        body="You don't have permission to view this chat, or the session has ended."
        icon={ShieldAlert}
      />
    );
  }

  if (isServerError || timedOut) {
    return (
      <ChatErrorState
        onBack={onBack}
        title={timedOut ? "Taking too long" : "Server error"}
        body={
          timedOut
            ? "The chat request didn't complete. Try again in a moment."
            : "Something went wrong loading this chat."
        }
        cta="Retry"
        onCta={() => mutate()}
      />
    );
  }

  if (error || !chat) {
    return (
      <ChatErrorState
        onBack={onBack}
        title="Unable to load chat"
        body="An unexpected error occurred. Please try again."
        cta="Retry"
        onCta={() => mutate()}
      />
    );
  }

  return (
    <div
      className={cn("flex flex-col h-screen bg-[#F8FAFC]", poppins.className)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
        <button
          onClick={onBack}
          aria-label="Back"
          className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
          {meta?.patientProfileImage ? (
            <img
              src={meta.patientProfileImage}
              alt={meta.patientName}
              className="w-full h-full object-cover"
            />
          ) : (
            (meta?.patientName || "P").charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {meta?.patientName || "Patient"}
          </p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                hasEnded ? "bg-slate-400" : "bg-emerald-500 animate-pulse",
              )}
            />
            {hasEnded ? "Session ended" : "Live"}
            <span>·</span>
            <Clock size={9} />
            {meta?.durationLabel}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <MessageCircle size={24} />
            </div>
            <p className="font-bold text-slate-900">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Start the conversation — the patient will see your reply
              instantly.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} role={role} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {!hasEnded ? (
        <div className="border-t border-slate-100 bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {sendError && (
            <p className="text-[11px] text-rose-600 mb-1 px-1">{sendError}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 min-h-10 max-h-32 px-3 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors shrink-0"
              aria-label="Send"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 text-center">
          <p className="text-xs font-semibold text-slate-500">
            This session has ended. Chat is read-only.
          </p>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  role,
}: {
  msg: ChatMessage;
  role: "patient" | "medic";
}) {
  const mine = msg.senderRole === role;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", mine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
          mine
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-white text-slate-900 border border-slate-100 rounded-bl-sm",
        )}
      >
        {msg.mediaType === "prescription" && msg.prescriptionData ? (
          <div>
            <p className="font-bold mb-1">Prescription</p>
            {msg.prescriptionData.drugs?.map((d: any, i: number) => (
              <p key={i} className="text-[11px] leading-relaxed">
                • {d.name}
                {d.dosage ? ` · ${d.dosage}` : ""}
                {d.frequency ? ` · ${d.frequency}` : ""}
              </p>
            ))}
            {msg.prescriptionData.instructions && (
              <p className="text-[10px] mt-1 opacity-90 italic">
                {msg.prescriptionData.instructions}
              </p>
            )}
          </div>
        ) : msg.mediaType === "tests" && msg.testsData ? (
          <div>
            <p className="font-bold mb-1">Tests requested</p>
            {msg.testsData.tests?.map((t: any, i: number) => (
              <p key={i} className="text-[11px] leading-relaxed">
                • {t.name}
                {t.priority ? ` (${t.priority})` : ""}
              </p>
            ))}
          </div>
        ) : msg.mediaType === "note" && msg.noteData ? (
          <div>
            <p className="font-bold mb-1">{msg.noteData.title}</p>
            <p className="text-[11px] leading-relaxed">{msg.noteData.body}</p>
          </div>
        ) : msg.mediaType === "image" ? (
          <a
            href={msg.mediaUrl ? `${msg.mediaUrl}?raw=1` : "#"}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <img
              src={msg.mediaUrl ? `${msg.mediaUrl}?raw=1` : ""}
              alt={msg.fileName || "image"}
              className="rounded-lg max-h-56"
            />
          </a>
        ) : msg.mediaType === "voice" ? (
          <p className="text-[11px] italic opacity-90">
            Voice note · {Math.round((msg.mediaDurationMs || 0) / 1000)}s
          </p>
        ) : msg.mediaType === "pdf" ? (
          <a
            href={msg.mediaUrl ? `${msg.mediaUrl}?raw=1` : "#"}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] underline"
          >
            📄 {msg.fileName || "Attached PDF"}
          </a>
        ) : (
          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        )}
        <p
          className={cn(
            "text-[9px] mt-1 tabular-nums",
            mine ? "text-emerald-100/80" : "text-slate-400",
          )}
        >
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : ""}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Fallback states ─────────────────────────────────
function ChatSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <button
          onClick={onBack}
          aria-label="Back"
          className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-2 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-12 rounded-2xl animate-pulse",
              i % 2 === 0
                ? "bg-emerald-100 ml-auto max-w-[60%]"
                : "bg-slate-100 max-w-[50%]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ChatErrorState({
  onBack,
  title,
  body,
  cta,
  onCta,
  icon: Icon = AlertCircle,
}: {
  onBack: () => void;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <button
          onClick={onBack}
          aria-label="Back"
          className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Icon size={28} />
          </div>
          <p className="font-bold text-slate-900 mb-1">{title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
          {cta && onCta && (
            <button
              onClick={onCta}
              className="mt-4 inline-flex items-center gap-1.5 min-h-10 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              <RotateCw size={14} /> {cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
