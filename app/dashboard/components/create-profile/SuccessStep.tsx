"use client";

import React from "react";
import { CheckCircle, Clock, Mail, Phone, ExternalLink } from "lucide-react";

import { MedicRegistrationData } from "../../type/registration_type";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface SuccessStepProps {
  formData: MedicRegistrationData;
}

const TIMELINE = [
  {
    step: "01",
    title: "Document Verification",
    desc: "Our team is reviewing your uploaded credentials.",
  },
  {
    step: "02",
    title: "Background Check",
    desc: "Standard safety and compliance validation.",
  },
  {
    step: "03",
    title: "Platform Orientation",
    desc: "Access instructions for the provider dashboard.",
  },
  {
    step: "04",
    title: "Activation",
    desc: "Profile goes live for patient matching.",
  },
];

const SuccessStep: React.FC<SuccessStepProps> = ({ formData }) => {
  return (
    <div
      className={`w-full max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-12 ${poppins.className}`}
    >
      {/* Hero */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-sm">
          <CheckCircle
            size={40}
            className="text-emerald-600 sm:hidden"
            aria-hidden="true"
          />
          <CheckCircle
            size={48}
            className="text-emerald-600 hidden sm:block"
            aria-hidden="true"
          />
        </div>
        <h2
          className={`text-3xl sm:text-4xl md:text-6xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight ${bebasNeue.className}`}
        >
          REGISTRATION <span className="text-emerald-600">SUBMITTED</span>
        </h2>
        <p className="text-slate-700 text-sm sm:text-base md:text-lg max-w-md mx-auto">
          Thank you for joining our network. We are carefully reviewing your
          profile and will be in touch within 24–48 hours.
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-sm">
        <h3
          className={`text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-2 ${bebasNeue.className}`}
        >
          <Clock
            className="text-emerald-600 shrink-0"
            size={22}
            aria-hidden="true"
          />
          WHAT&apos;S NEXT?
        </h3>

        <div className="space-y-5 sm:space-y-6">
          {TIMELINE.map((item, i, arr) => (
            <div key={item.step} className="flex gap-3 sm:gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold flex items-center justify-center text-xs">
                  {item.step}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-[1px] flex-grow bg-slate-200 my-2" />
                )}
              </div>
              <div className="pb-3 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Access */}
      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-white mb-6 sm:mb-8">
        <h3
          className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${bebasNeue.className}`}
        >
          PREPARE YOUR DASHBOARD
        </h3>
        <p className="text-slate-300 mb-5 sm:mb-6 text-xs sm:text-sm leading-relaxed">
          Once approved, your professional dashboard is where you will manage
          consultations, view earnings, and update your schedule.
        </p>
        <a
          href="https://medics.dozamedic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/20 text-sm sm:text-base"
        >
          Visit Dashboard <ExternalLink size={18} aria-hidden="true" />
        </a>
      </div>

      {/* Support */}
      <div className="text-center space-y-4">
        <p className="text-slate-600 text-xs sm:text-sm">
          Need immediate assistance? Contact our support team:
        </p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-3 sm:gap-6 text-sm font-medium">
          <a
            href="mailto:help@dozamedic.com"
            className="flex items-center justify-center gap-2 text-slate-700 hover:text-emerald-700 transition-colors"
          >
            <Mail size={18} aria-hidden="true" /> help@dozamedic.com
          </a>

          <a
            href="https://wa.me/2348127728084"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-slate-700 hover:text-emerald-700 transition-colors"
            aria-label="Contact us on WhatsApp"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.955c-.003 5.445-4.439 9.88-9.885 9.88z" />
            </svg>
            WhatsApp
          </a>

          <a
            href="tel:+2348127728084"
            className="flex items-center justify-center gap-2 text-slate-700 hover:text-emerald-700 transition-colors"
          >
            <Phone size={18} aria-hidden="true" /> +234 81 2772 8084
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuccessStep;
