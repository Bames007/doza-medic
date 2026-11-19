// app/utils/notify.ts
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

/**
 * Call on the first user gesture (tap / keypress) so browser autoplay
 * policies allow later programmatic beeps.
 */
export function primeAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch {}
}

/** Two-tone "ping" — synthesised, no asset file needed. */
export function playMessageChime() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const chirp = (freq: number, delay: number, gainPeak: number) => {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.start(t0);
      osc.stop(t0 + 0.23);
    };
    chirp(880, 0, 0.18);
    chirp(1320, 0.13, 0.14);
  } catch {}
}

/* ─── Device (OS) notifications ──────────────────────── */

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window))
    return "denied";
  if (
    Notification.permission === "granted" ||
    Notification.permission === "denied"
  )
    return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showDeviceNotification(
  title: string,
  body: string,
  opts?: {
    tag?: string;
    onClick?: () => void;
    silent?: boolean;
  },
): Notification | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const n = new Notification(title, {
      body,
      tag: opts?.tag,
      // silent by default so we don't double up with the WebAudio chime
      silent: opts?.silent ?? true,
      icon: "/icon-192.png",
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {}
      n.close();
      opts?.onClick?.();
    };
    return n;
  } catch {
    return null;
  }
}
