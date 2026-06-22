import React from "react";
import { RefreshCw } from "lucide-react";

export default function CaptchaBlock({
  captchaImage,
  onRefresh,
  register,
  error,
}) {
  return (
    <div className="space-y-2">
      <label className="label">Security Verification (Captcha)</label>

      <div className="flex items-center gap-3">
        {captchaImage ? (
          <img
            src={`data:image/png;base64,${captchaImage}`}
            alt="captcha"
            className="h-12 rounded-lg border border-gray-200 bg-gray-50 select-none"
            draggable={false}
          />
        ) : (
          <div className="h-12 w-32 rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
        )}

        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-full hover:bg-primary-50 text-primary-500 transition"
          title="Refresh captcha"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <input
        {...register("captcha", { required: "Please enter the captcha text" })}
        type="text"
        placeholder="Enter characters shown above"
        className={`input-field ${error ? "input-error" : ""}`}
      />
      {error && <p className="error-msg">⚠ {error.message}</p>}
    </div>
  );
}
