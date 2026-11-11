// app/utils/firebaseAdmin.ts
import "server-only";
import {
  initializeApp,
  getApps,
  cert,
  getApp,
  type App,
} from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import { getAuth, type Auth } from "firebase-admin/auth";

function getOrInitializeApp(): App {
  const g = globalThis as unknown as { __FIREBASE_ADMIN_APP__?: App };
  if (g.__FIREBASE_ADMIN_APP__) return g.__FIREBASE_ADMIN_APP__;

  if (getApps().length > 0) {
    const existing = getApp();
    g.__FIREBASE_ADMIN_APP__ = existing;
    return existing;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error(
      "Missing required Firebase Admin env vars. Need FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_DATABASE_URL.",
    );
  }

  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });

  g.__FIREBASE_ADMIN_APP__ = app;
  return app;
}

function lazyProxy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_t, prop, receiver) {
      const real = factory();
      const value = Reflect.get(real as any, prop, receiver);
      return typeof value === "function" ? value.bind(real) : value;
    },
    set(_t, prop, value) {
      const real = factory();
      return Reflect.set(real as any, prop, value);
    },
    has(_t, prop) {
      return prop in factory();
    },
  });
}

export const adminDb: Database = lazyProxy(() =>
  getDatabase(getOrInitializeApp()),
);
export const adminAuth: Auth = lazyProxy(() => getAuth(getOrInitializeApp()));
