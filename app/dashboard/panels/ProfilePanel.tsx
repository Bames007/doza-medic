// app/dashboard/panels/UpdateProfile.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Globe,
  Save,
  RotateCw,
  Check,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  X,
  Plus,
  Languages,
  Video,
  Home as HomeIcon,
} from "lucide-react";
import { ref, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { useMedic } from "../DashboardContext";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

type Section = "personal" | "professional" | "practice" | "location";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "professional", label: "Professional", icon: Briefcase },
  { id: "practice", label: "Practice", icon: Stethoscope },
  { id: "location", label: "Location", icon: MapPin },
];

const COMMON_LANGUAGES = [
  "English",
  "Yoruba",
  "Hausa",
  "Igbo",
  "Ibibio",
  "Arabic",
  "French",
  "Hindi",
  "Portuguese",
  "Spanish",
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function UpdateProfile() {
  const { medic, setMedic, refreshSession } = useMedic();
  const [activeSection, setActiveSection] = useState<Section>("personal");
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Hydrate form from context ──────────────────────────────
  useEffect(() => {
    if (!medic) return;
    setFormData({
      personalInfo: {
        firstName: medic.firstName ?? "",
        lastName: medic.lastName ?? "",
        email: medic.email ?? "",
        phone: medic.phone ?? "",
        gender: medic.gender ?? "",
        profilePhoto: medic.profilePhoto ?? null,
      },
      professionalInfo: {
        role: medic.professionalRole ?? "",
        specialties: medic.specialties ?? [],
        licenseNumber: medic.licenseNumber ?? "",
        yearsOfExperience: medic.yearsOfExperience ?? 0,
      },
      practiceInfo: {
        consultationTypes: medic.consultationTypes ?? {
          inPerson: true,
          online: false,
          homeVisit: false,
        },
        hourlyRate: medic.hourlyRate ?? 0,
        availability: medic.availability ?? {
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          hours: { start: "09:00", end: "17:00" },
          emergencyAvailable: false,
        },
      },
      location: (medic.location as any) ?? {
        address: "",
        city: "",
        state: "",
        country: "",
      },
    });
  }, [medic]);

  if (!medic || !formData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <RotateCw className="animate-spin text-emerald-600" size={28} />
      </div>
    );
  }

  // ── Helpers ────────────────────────────────────────────────
  const patch = (section: keyof typeof formData, key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setSaved(false);
  };

  const patchNested = (
    section: keyof typeof formData,
    path: string[],
    value: any,
  ) => {
    setFormData((prev: any) => {
      const next = { ...prev };
      let cursor = next[section];
      for (let i = 0; i < path.length - 1; i++) {
        cursor[path[i]] = { ...cursor[path[i]] };
        cursor = cursor[path[i]];
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
    setSaved(false);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      patch("personalInfo", "profilePhoto", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleArrayItem = (
    section: keyof typeof formData,
    key: string,
    item: string,
  ) => {
    const current: string[] = formData[section][key] ?? [];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    patch(section, key, next);
  };

  // ── Save to Firebase ───────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const now = new Date().toISOString();
      const updates = {
        personalInfo: {
          ...formData.personalInfo,
          email: medic.email, // keep auth email in sync
        },
        professionalInfo: {
          ...formData.professionalInfo,
          customRole: "",
          customSpecialty: "",
          qualifications: [],
          bio: "",
        },
        practiceInfo: {
          ...formData.practiceInfo,
          languages: formData.practiceInfo.languages ?? ["English"],
        },
        location: formData.location,
        lastUpdated: now,
      };

      await update(ref(db, `doza_medics/${medic.id}`), updates);
      await refreshSession(); // re-reads from Firebase, updates context + localStorage
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      console.error("[profile save]", e);
      setError(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const userInitial =
    formData.personalInfo.firstName?.charAt(0) || medic.email?.charAt(0) || "M";

  return (
    <div className={cn("pb-28 lg:pb-8", poppins.className)}>
      {/* ════════════════════════════════════════════════════════
          HERO / AVATAR
          ════════════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 lg:px-8 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 lg:p-8 text-white shadow-xl shadow-emerald-500/20"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <label className="cursor-pointer group block">
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  {formData.personalInfo.profilePhoto ? (
                    <img
                      src={formData.personalInfo.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-black text-4xl">
                      {userInitial}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <Camera className="text-white" size={24} />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </label>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg">
                <Camera size={14} />
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h1
                className={cn(
                  "text-3xl lg:text-4xl font-bold leading-tight truncate",
                  bebasNeue.className,
                )}
              >
                {formData.personalInfo.firstName}{" "}
                {formData.personalInfo.lastName}
              </h1>
              <p className="text-emerald-100/90 text-sm mt-1 capitalize">
                {formData.professionalInfo.role || "Doza Medic"}
              </p>
              <p className="text-emerald-100/70 text-xs mt-0.5 truncate">
                {medic.email}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                {medic.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-400/20 backdrop-blur-sm border border-amber-200/30 rounded-full px-3 py-1 text-amber-100">
                    <AlertCircle size={12} /> Pending
                  </span>
                )}
                {formData.professionalInfo.yearsOfExperience > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
                    <GraduationCap size={12} />
                    {formData.professionalInfo.yearsOfExperience} yrs
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION TABS
          ════════════════════════════════════════════════════════ */}
      <div className="px-4 lg:px-8 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 custom-scrollbar">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-white text-slate-600 border border-slate-100 hover:border-emerald-200",
                )}
              >
                <Icon size={14} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          FORM
          ════════════════════════════════════════════════════════ */}
      <div className="px-4 lg:px-8 mt-4 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8"
          >
            {activeSection === "personal" && (
              <div className="space-y-5">
                <SectionHeading
                  title="Personal information"
                  subtitle="How patients and the platform see you"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="First name" icon={UserIcon}>
                    <input
                      type="text"
                      value={formData.personalInfo.firstName}
                      onChange={(e) =>
                        patch("personalInfo", "firstName", e.target.value)
                      }
                      placeholder="John"
                    />
                  </Field>

                  <Field label="Last name" icon={UserIcon}>
                    <input
                      type="text"
                      value={formData.personalInfo.lastName}
                      onChange={(e) =>
                        patch("personalInfo", "lastName", e.target.value)
                      }
                      placeholder="Doe"
                    />
                  </Field>
                </div>

                <Field label="Email (locked)" icon={Mail}>
                  <input
                    type="email"
                    value={formData.personalInfo.email}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Phone" icon={Phone}>
                    <input
                      type="tel"
                      value={formData.personalInfo.phone}
                      onChange={(e) =>
                        patch("personalInfo", "phone", e.target.value)
                      }
                      placeholder="+234…"
                    />
                  </Field>

                  <Field label="Gender" icon={UserIcon}>
                    <select
                      value={formData.personalInfo.gender}
                      onChange={(e) =>
                        patch("personalInfo", "gender", e.target.value)
                      }
                    >
                      <option value="">Select…</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {activeSection === "professional" && (
              <div className="space-y-5">
                <SectionHeading
                  title="Professional background"
                  subtitle="Your role, credentials and experience"
                />

                <Field label="Role" icon={Briefcase}>
                  <input
                    type="text"
                    value={formData.professionalInfo.role}
                    onChange={(e) =>
                      patch("professionalInfo", "role", e.target.value)
                    }
                    placeholder="e.g. Nurse, Doctor, Pharmacist"
                  />
                </Field>

                <Field label="Specialties" icon={Stethoscope}>
                  <TagInput
                    values={formData.professionalInfo.specialties}
                    onAdd={(v) => {
                      const cur = formData.professionalInfo.specialties;
                      if (!cur.includes(v))
                        patch("professionalInfo", "specialties", [...cur, v]);
                    }}
                    onRemove={(v) => {
                      patch(
                        "professionalInfo",
                        "specialties",
                        formData.professionalInfo.specialties.filter(
                          (x: string) => x !== v,
                        ),
                      );
                    }}
                    placeholder="Add specialty (e.g. Cardiology)"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="License number" icon={ShieldCheck}>
                    <input
                      type="text"
                      value={formData.professionalInfo.licenseNumber}
                      onChange={(e) =>
                        patch(
                          "professionalInfo",
                          "licenseNumber",
                          e.target.value,
                        )
                      }
                      placeholder="LIC-123456"
                    />
                  </Field>

                  <Field label="Years of experience" icon={GraduationCap}>
                    <input
                      type="number"
                      min={0}
                      value={formData.professionalInfo.yearsOfExperience}
                      onChange={(e) =>
                        patch(
                          "professionalInfo",
                          "yearsOfExperience",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeSection === "practice" && (
              <div className="space-y-6">
                <SectionHeading
                  title="Practice setup"
                  subtitle="Consultation methods, hours and rates"
                />

                {/* Consultation types */}
                <div>
                  <Label>Consultation methods</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { key: "inPerson", label: "In‑Person", icon: UserIcon },
                      { key: "online", label: "Online", icon: Video },
                      { key: "homeVisit", label: "Home Visit", icon: HomeIcon },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active =
                        formData.practiceInfo.consultationTypes[m.key];
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() =>
                            patchNested(
                              "practiceInfo",
                              ["consultationTypes", m.key],
                              !active,
                            )
                          }
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            active
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 hover:border-emerald-300 text-slate-500",
                          )}
                        >
                          <Icon size={20} />
                          <span className="text-xs font-bold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hourly rate */}
                <Field label="Hourly rate (₦)" icon={DollarSign}>
                  <input
                    type="number"
                    min={0}
                    value={formData.practiceInfo.hourlyRate}
                    onChange={(e) =>
                      patch(
                        "practiceInfo",
                        "hourlyRate",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                  />
                </Field>

                {/* Days */}
                <div>
                  <Label>Available days</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS.map((day) => {
                      const active =
                        formData.practiceInfo.availability.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days =
                              formData.practiceInfo.availability.days;
                            const next = days.includes(day)
                              ? days.filter((d: string) => d !== day)
                              : [...days, day];
                            patchNested(
                              "practiceInfo",
                              ["availability", "days"],
                              next,
                            );
                          }}
                          className={cn(
                            "px-3.5 py-2 rounded-full text-xs font-bold capitalize border-2 transition-all",
                            active
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300",
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start time" icon={Clock}>
                    <input
                      type="time"
                      value={formData.practiceInfo.availability.hours.start}
                      onChange={(e) =>
                        patchNested(
                          "practiceInfo",
                          ["availability", "hours", "start"],
                          e.target.value,
                        )
                      }
                    />
                  </Field>
                  <Field label="End time" icon={Clock}>
                    <input
                      type="time"
                      value={formData.practiceInfo.availability.hours.end}
                      onChange={(e) =>
                        patchNested(
                          "practiceInfo",
                          ["availability", "hours", "end"],
                          e.target.value,
                        )
                      }
                    />
                  </Field>
                </div>

                {/* Emergency */}
                <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      formData.practiceInfo.availability.emergencyAvailable
                    }
                    onChange={(e) =>
                      patchNested(
                        "practiceInfo",
                        ["availability", "emergencyAvailable"],
                        e.target.checked,
                      )
                    }
                    className="w-5 h-5 rounded accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Available for emergencies
                    </p>
                    <p className="text-xs text-amber-700/80">
                      Patients can reach you outside regular hours
                    </p>
                  </div>
                </label>

                {/* Languages */}
                <Field label="Languages" icon={Languages}>
                  <TagInput
                    values={formData.practiceInfo.languages ?? ["English"]}
                    onAdd={(v) => {
                      const cur = formData.practiceInfo.languages ?? [];
                      if (!cur.includes(v))
                        patchNested("practiceInfo", ["languages"], [...cur, v]);
                    }}
                    onRemove={(v) => {
                      const cur = formData.practiceInfo.languages ?? [];
                      patchNested(
                        "practiceInfo",
                        ["languages"],
                        cur.filter((x: string) => x !== v),
                      );
                    }}
                    placeholder="Add language"
                    suggestions={COMMON_LANGUAGES}
                  />
                </Field>
              </div>
            )}

            {activeSection === "location" && (
              <div className="space-y-5">
                <SectionHeading
                  title="Practice location"
                  subtitle="Where you see patients in person"
                />

                <Field label="Address" icon={MapPin}>
                  <input
                    type="text"
                    value={formData.location.address ?? ""}
                    onChange={(e) =>
                      patch("location", "address", e.target.value)
                    }
                    placeholder="Street address"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="City" icon={MapPin}>
                    <input
                      type="text"
                      value={formData.location.city ?? ""}
                      onChange={(e) =>
                        patch("location", "city", e.target.value)
                      }
                      placeholder="Lagos"
                    />
                  </Field>
                  <Field label="State" icon={MapPin}>
                    <input
                      type="text"
                      value={formData.location.state ?? ""}
                      onChange={(e) =>
                        patch("location", "state", e.target.value)
                      }
                      placeholder="Lagos"
                    />
                  </Field>
                  <Field label="Country" icon={Globe}>
                    <input
                      type="text"
                      value={formData.location.country ?? ""}
                      onChange={(e) =>
                        patch("location", "country", e.target.value)
                      }
                      placeholder="Nigeria"
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      patch("location", "lat", pos.coords.latitude);
                      patch("location", "lng", pos.coords.longitude);
                    });
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <MapPin size={16} /> Pin my current location
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Feedback + Save ──────────────────────────────── */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 mb-8 flex items-center justify-end gap-3">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"
            >
              <Check size={14} /> Saved
            </motion.span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-lg",
              saving
                ? "bg-slate-200 text-slate-400 cursor-wait"
                : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/20",
            )}
          >
            {saving ? (
              <>
                <RotateCw className="animate-spin" size={14} /> Saving…
              </>
            ) : (
              <>
                <Save size={14} /> Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────
function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pb-4 border-b border-slate-100">
      <h2
        className={cn("text-2xl font-bold text-slate-900", bebasNeue.className)}
      >
        {title.toUpperCase()}
      </h2>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative group">
        <Icon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
          size={16}
        />
        <div
          className="
            [&_input]:w-full [&_input]:pl-10 [&_input]:pr-4 [&_input]:py-3
            [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200
            [&_input]:outline-none [&_input]:text-sm [&_input]:text-slate-800
            [&_input]:focus:border-emerald-500 [&_input]:focus:ring-4
            [&_input]:focus:ring-emerald-500/10 [&_input]:transition-all
            [&_input]:bg-white
            [&_select]:w-full [&_select]:pl-10 [&_select]:pr-4 [&_select]:py-3
            [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200
            [&_select]:outline-none [&_select]:text-sm [&_select]:text-slate-800
            [&_select]:focus:border-emerald-500 [&_select]:focus:ring-4
            [&_select]:focus:ring-emerald-500/10 [&_select]:transition-all
            [&_select]:bg-white [&_select]:appearance-none
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Tag input with optional suggestions ─────────────────────────
function TagInput({
  values,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
}: {
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const filteredSuggestions =
    suggestions?.filter(
      (s) =>
        !values.includes(s) &&
        s.toLowerCase().includes(input.toLowerCase().trim()) &&
        input.trim().length > 0,
    ) ?? [];

  const commit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <AnimatePresence>
          {values.map((v) => (
            <motion.span
              key={v}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {values.length === 0 && (
          <span className="text-xs text-slate-400 italic py-1.5">
            None yet — add below
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 outline-none text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
        <button
          type="button"
          onClick={commit}
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-900 text-white disabled:bg-slate-200 transition-colors"
        >
          <Plus size={14} />
        </button>

        {/* Suggestions dropdown */}
        {filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-lg z-10 max-h-40 overflow-y-auto">
            {filteredSuggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onAdd(s);
                  setInput("");
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
