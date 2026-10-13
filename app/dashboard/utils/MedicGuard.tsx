// components/MedicGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/utils/firebaseConfig";
import { getMedicSession, clearMedicSession } from "./medicSession";

export default function MedicGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getMedicSession();

    // No local medic session → back to login
    if (!session) {
      router.replace("/");
      return;
    }

    // Verify Firebase Auth still has this user signed in.
    // Firebase Auth persists its own session in IndexedDB, so this is
    // the real source of truth — no API round-trip needed.
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase Auth lost the session (sign-out elsewhere, expired, etc.)
        clearMedicSession();
        router.replace("/");
        return;
      }
      // Firebase says we're still signed in — trust the local medic cache
      setReady(true);
    });

    return () => unsub();
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
