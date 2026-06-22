import React from "react";

export default function SuccessScreen({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 fade-up overflow-hidden">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="font-display text-3xl text-primary-700 mb-3 text-center">
        Registration Successful!
      </h2>
      <p className="text-gray-500 text-center max-w-sm font-body mb-8">
        Your details have been received. Our team will contact you shortly to
        confirm your appointment.
      </p>
      <button
        onClick={onReset}
        className="px-8 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition shadow-md"
      >
        Register Another Patient
      </button>
    </div>
  );
}
