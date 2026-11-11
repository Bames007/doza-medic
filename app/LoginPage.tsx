// app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/app/utils/firebaseConfig";
import { bebasNeue, poppins } from "@/app/utils/constants";
import BubbleTransition from "./components/BubbleTransitions";
import { getMedicSession, saveMedicSession } from "./utils/medicSession";

const MedicLoginPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  // ── Bubble coordination state ──
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDone, setBubbleDone] = useState(false);
  const [loginResult, setLoginResult] = useState<"success" | "error" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const existing = getMedicSession();
    if (existing) router.replace("/dashboard");
  }, [router]);

  // ── Navigate once bubble is done AND login succeeded ──
  useEffect(() => {
    if (!bubbleDone) return;
    if (loginResult === "success") {
      router.push("/dashboard");
    }
    // For "error", the handleLogin catch already called setShowBubble(false)
  }, [bubbleDone, loginResult, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return "Please enter a valid email address";
        return "";
      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError("");
    setFieldErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const hasErrors = () =>
    Object.values(fieldErrors).some((v) => v !== "") ||
    !formData.email.trim() ||
    !formData.password.trim();

  const friendlyAuthError = (code?: string): string => {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "That email address isn't valid.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support@doza.com.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again in a few minutes.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return "Login failed. Please try again.";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const freshErrors = {
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };
    setFieldErrors(freshErrors);
    if (Object.values(freshErrors).some((v) => v !== "")) return;

    // ── Show the bubble + disable the form ──
    setSubmitting(true);
    setShowBubble(true);
    setBubbleDone(false);
    setLoginResult(null);

    const email = formData.email.trim().toLowerCase();

    try {
      // ── 1. Firebase Auth ──
      let uid: string;
      let idToken: string;
      try {
        const cred = await signInWithEmailAndPassword(
          auth,
          email,
          formData.password,
        );
        uid = cred.user.uid;
        idToken = await cred.user.getIdToken();
      } catch (authErr: any) {
        // Hide bubble immediately on auth failure
        setShowBubble(false);
        setSubmitting(false);
        setError(friendlyAuthError(authErr?.code));
        return;
      }

      // ── 2. Mint the __session cookie ──
      try {
        const cookieRes = await fetch("/api/medic/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          credentials: "include",
        });

        if (!cookieRes.ok) {
          const raw = await cookieRes.text().catch(() => "");
          let message = "Could not establish session. Try again.";
          let code: string | null = null;

          try {
            const json = raw ? JSON.parse(raw) : {};
            if (json?.error) message = json.error;
            if (json?.code) code = json.code;
          } catch {
            // HTML error page — show the status so you know what broke
            message = `Session error (HTTP ${cookieRes.status})`;
          }

          console.error("[/login] cookie exchange failed", {
            status: cookieRes.status,
            body: raw.substring(0, 500),
            code,
          });

          await signOut(auth);
          setShowBubble(false);
          setSubmitting(false);
          setError(message);
          return;
        }
      } catch {
        await signOut(auth);
        setShowBubble(false);
        setSubmitting(false);
        setError("Could not establish session. Try again.");
        return;
      }

      // ── 3. Load medic profile ──
      const snap = await get(ref(db, `doza_medics/${uid}`));
      if (!snap.exists()) {
        await signOut(auth);
        setShowBubble(false);
        setSubmitting(false);
        setError("No Doza Medic profile linked to this account.");
        return;
      }

      const r = snap.val();

      if (r.status === "suspended" || r.status === "rejected") {
        await signOut(auth);
        setShowBubble(false);
        setSubmitting(false);
        setError(`Your account is ${r.status}. Contact support@doza.com.`);
        return;
      }

      const medic = {
        id: uid,
        email: r.personalInfo?.email || email,
        firstName: r.personalInfo?.firstName || "",
        lastName: r.personalInfo?.lastName || "",
        fullName:
          `${r.personalInfo?.firstName ?? ""} ${r.personalInfo?.lastName ?? ""}`.trim() ||
          email,
        phone: r.personalInfo?.phone || "",
        gender: r.personalInfo?.gender || "",
        profilePhoto: r.personalInfo?.profilePhoto ?? null,
        professionalRole: r.professionalInfo?.role || "",
        specialties: r.professionalInfo?.specialties ?? [],
        licenseNumber: r.professionalInfo?.licenseNumber || "",
        yearsOfExperience: r.professionalInfo?.yearsOfExperience || 0,
        consultationTypes: r.practiceInfo?.consultationTypes ?? {
          inPerson: true,
          online: false,
          homeVisit: false,
        },
        hourlyRate: r.practiceInfo?.hourlyRate || 0,
        availability: r.practiceInfo?.availability,
        location: r.location,
        verified: !!r.verified,
        status: r.status ?? "pending",
        profileComplete: !!r.profileComplete,
      };

      // ── 4. Save session + clear stale patient keys ──
      saveMedicSession({
        medic,
        token: uid,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      localStorage.removeItem("userSession");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      sessionStorage.removeItem("userSession");

      // ── 5. Success — bubble stays visible until animation ends ──
      setLoginResult("success");
      // The useEffect above will navigate once bubbleDone is true.
      // If the bubble animation has already finished, navigate immediately.
      // If it hasn't, wait for onAnimationComplete.
      // Note: we do NOT setSubmitting(false) here because we're navigating.
    } catch (err: any) {
      console.error("[/login]", err);
      setShowBubble(false);
      setSubmitting(false);
      setError("Login failed. Please try again.");
    }
  };

  const handleGetHelp = () => {
    window.location.href =
      "mailto:dozamedichq@gmail.com?subject=Medic%20Login%20Assistance&body=Please%20help%20me%20access%20my%20Doza%20Medic%20account.";
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 selection:bg-emerald-100 ${poppins.className}`}
    >
      {/* ── Bubble transition ── */}
      <AnimatePresence>
        {showBubble && (
          <BubbleTransition
            phase="closing"
            duration={1.2}
            onAnimationComplete={() => setBubbleDone(true)}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] border border-white overflow-hidden"
        >
          {/* Left column — branding */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-700 p-16 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:32px_32px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Image
                    src="/logo.png"
                    alt="Doza Logo"
                    width={28}
                    height={28}
                    priority
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
                <span
                  className={`text-2xl tracking-tighter font-bold text-white ${bebasNeue.className}`}
                >
                  DOZA
                </span>
              </div>
              <h1
                className={`text-6xl font-bold text-white leading-[0.95] mb-8 ${bebasNeue.className}`}
              >
                MEDIC <br />
                <span className="text-emerald-200 text-7xl">PORTAL.</span>
              </h1>
              <p className="text-emerald-50/70 text-lg leading-relaxed max-w-sm">
                Your independent practice — patients, consults and earnings in
                one place.
              </p>
            </div>
            <div className="relative z-10 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
              <div className="flex items-center gap-4 text-white">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Private practice access</p>
                  <p className="text-xs text-emerald-100/60">
                    Only registered Doza Medics can sign in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — form */}
          <div className="lg:col-span-7 p-8 md:p-16 lg:p-20 flex flex-col justify-center bg-white/50">
            <div className="max-w-md mx-auto w-full">
              <div className="lg:hidden flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Doza Logo"
                    width={32}
                    height={32}
                    priority
                    style={{ width: "auto", height: "auto" }}
                  />
                  <span
                    className={`text-2xl font-bold text-slate-900 ${bebasNeue.className}`}
                  >
                    DOZA
                  </span>
                </div>
              </div>

              <header className="mb-10 text-left">
                <h2
                  className={`text-5xl font-bold text-slate-700 mb-2 ${bebasNeue.className}`}
                >
                  Medic Login
                </h2>
                <p className="text-slate-500 font-medium">
                  Sign in with the email you used to register as a Doza Medic.
                </p>
              </header>

              {(error || Object.values(fieldErrors).some((v) => v)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 mb-8"
                >
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Authentication Error</p>
                        <p className="opacity-80">{error}</p>
                      </div>
                    </div>
                  )}
                  {Object.values(fieldErrors).some((v) => v) && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Please fix:
                      </p>
                      <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-1">
                        {fieldErrors.email && (
                          <li>Email: {fieldErrors.email}</li>
                        )}
                        {fieldErrors.password && (
                          <li>Password: {fieldErrors.password}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Medic Email
                    </label>
                    {fieldErrors.email && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      disabled={submitting}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none ${
                        fieldErrors.email
                          ? "border-red-200 bg-red-50/30"
                          : "border-transparent focus:bg-white focus:border-emerald-500"
                      } disabled:opacity-60`}
                      placeholder="you@yourpractice.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    {fieldErrors.password && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      disabled={submitting}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-900 transition-all outline-none ${
                        fieldErrors.password
                          ? "border-red-200 bg-red-50/30"
                          : "border-transparent focus:bg-white focus:border-emerald-500"
                      } disabled:opacity-60`}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitting}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors disabled:opacity-60"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting || hasErrors()}
                  className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl shadow-slate-900/10 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {submitting ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      ENTER MEDIC PORTAL
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </motion.button>
              </form>

              <footer className="mt-12 text-center">
                <button
                  onClick={handleGetHelp}
                  className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mx-auto transition-colors"
                >
                  <Mail size={14} /> Medic Support
                </button>

                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-6">
                  <button
                    onClick={() => {
                      window.location.href =
                        "https://dozamedic.com/registration/medic";
                    }}
                    className="text-[10px] font-black text-emerald-500 hover:text-emerald-700 uppercase tracking-[0.2em] transition-colors"
                  >
                    Register as Medic
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <ChevronLeft size={14} /> Back to Site
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MedicLoginPage;
