// app/utils/useBackGuard.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseBackGuardOptions {
  activePanel: string;
  rootPanel?: string;
  onReturnHome: () => void;
  enabled?: boolean;
}

interface UseBackGuardResult {
  showExitConfirm: boolean;
  confirmExit: () => void;
  cancelExit: () => void;
}

export function useBackGuard({
  activePanel,
  rootPanel = "dashboard",
  onReturnHome,
  enabled = true,
}: UseBackGuardOptions): UseBackGuardResult {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const activePanelRef = useRef(activePanel);
  const rootPanelRef = useRef(rootPanel);
  const onReturnHomeRef = useRef(onReturnHome);
  const confirmedRef = useRef(false);
  const sentinelUrlRef = useRef<string>("");

  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);
  useEffect(() => {
    rootPanelRef.current = rootPanel;
  }, [rootPanel]);
  useEffect(() => {
    onReturnHomeRef.current = onReturnHome;
  }, [onReturnHome]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    if (!sentinelUrlRef.current) {
      sentinelUrlRef.current =
        window.location.pathname +
        window.location.search +
        window.location.hash;
    }

    let lastRestoreAt = 0;

    // 🔑 THE FIX: spread the existing state instead of replacing it.
    // Next.js App Router stores its router tree in history.state under
    // __NA / tree / key. If we overwrite that, its popstate handler
    // sees an "unknown" entry and triggers a hard reload to resync.
    // Merging keeps Next.js happy AND adds our marker.
    const pushSentinel = () => {
      try {
        const existing = window.history.state;
        const nextState =
          existing && typeof existing === "object"
            ? { ...existing, __dozaBackGuard: true }
            : { __dozaBackGuard: true };
        window.history.pushState(nextState, "", sentinelUrlRef.current);
      } catch {
        /* ignore */
      }
    };

    // Seed the sentinel
    pushSentinel();

    const handlePopState = () => {
      if (confirmedRef.current) return;

      // Some mobile browsers double-fire popstate on one gesture.
      const now = Date.now();
      if (now - lastRestoreAt < 250) return;
      lastRestoreAt = now;

      // Restore URL + state FIRST, synchronously, before Next.js's
      // bubble-phase listener runs. By the time it reads history.state,
      // __NA and friends are intact and it treats the pop as a no-op.
      pushSentinel();

      const onRoot = activePanelRef.current === rootPanelRef.current;
      if (!onRoot) {
        onReturnHomeRef.current();
      } else {
        setShowExitConfirm(true);
      }
    };

    window.addEventListener("popstate", handlePopState, { capture: true });

    return () => {
      window.removeEventListener("popstate", handlePopState, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [enabled]);

  const confirmExit = useCallback(() => {
    confirmedRef.current = true;
    setShowExitConfirm(false);
    if (typeof window === "undefined") return;

    setTimeout(() => {
      try {
        // Prefer navigating to a real page over about:blank — blank
        // pages are jarring and can confuse PWA state restoration.
        window.location.replace("/");
      } catch {}
    }, 50);
  }, []);

  const cancelExit = useCallback(() => setShowExitConfirm(false), []);

  return { showExitConfirm, confirmExit, cancelExit };
}
