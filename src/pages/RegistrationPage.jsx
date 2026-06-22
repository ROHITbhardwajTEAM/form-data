// src/pages/RegistrationPage.jsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRegistration } from "../hooks/useRegistration";
import CaptchaBlock from "../components/CaptchaBlock";
import FileUpload from "../components/FileUpload";
import SuccessScreen from "../components/SuccessScreen";
import { aesDecrypt } from "../utils/crypto";

/* ─── small reusable field wrapper ─── */
function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="error-msg">⚠ {error.message}</p>}
    </div>
  );
}

export default function RegistrationPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isForeigner: "0",
    },
  });

  const isForeigner = watch("isForeigner");

  const {
    tokenData,
    loadingToken,
    tokenError,
    refetchToken,
    countries,
    loadingCountries,
    countriesError,
    submitting,
    submitError,
    submitSuccess,
    submitRegistration,
    setSubmitError,
  } = useRegistration();
  console.log("Token data:", tokenData);

  const onSubmit = (data) => {
    setSubmitError(null);
    submitRegistration(data);
  };

  if (submitSuccess) {
    return (
      <SuccessScreen
        onReset={() => {
          reset();
          refetchToken();
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 fade-up">
      {/* Page title */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl text-primary-700 mb-2">
          Patient Registration
        </h1>
        <p className="text-gray-400 font-body text-sm">
          Please fill in your details below. All fields marked * are required.
        </p>
      </div>

      {/* Token / captcha loading error */}
      {tokenError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex justify-between items-center">
          <span>⚠ Could not load captcha: {tokenError}</span>
          <button
            onClick={refetchToken}
            className="text-xs underline font-semibold ml-4"
          >
            Retry
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-white rounded-2xl shadow-card p-8 space-y-6"
      >
        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="First Name *" error={errors.firstName}>
            <input
              {...register("firstName", { required: "First name is required" })}
              type="text"
              placeholder="John"
              className={`input-field ${errors.firstName ? "input-error" : ""}`}
            />
          </Field>

          <Field label="Last Name *" error={errors.lastName}>
            <input
              {...register("lastName", { required: "Last name is required" })}
              type="text"
              placeholder="Doe"
              className={`input-field ${errors.lastName ? "input-error" : ""}`}
            />
          </Field>
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Date of Birth (DD/MM/YYYY) *" error={errors.dob}>
            <input
              {...register("dob", {
                required: "Date of birth is required",
                pattern: {
                  value: /^\d{4}-\d{2}-\d{2}$/,
                  message: "Use YYYY-MM-DD format",
                },
              })}
              type="date"
              max={new Date().toISOString().split("T")[0]}
              className={`input-field ${errors.dob ? "input-error" : ""}`}
            />
          </Field>

          <Field label="Gender *" error={errors.gender}>
            <select
              {...register("gender", { required: "Please select gender" })}
              className={`input-field ${errors.gender ? "input-error" : ""}`}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>

        {/* Mobile */}
        <Field label="Mobile Number *" error={errors.mobile}>
          <input
            {...register("mobile", {
              required: "Mobile number is required",
              pattern: {
                value: /^[+\d\s\-()]{7,15}$/,
                message: "Enter a valid mobile number",
              },
              maxLength: {
                value: 8,
                message: "Mobile number must be 8 digits",
              },
            })}
            maxLength={8}
            type="tel"
            placeholder="+230 5XXX XXXX"
            className={`input-field ${errors.mobile ? "input-error" : ""}`}
          />
        </Field>

        {/* Email (optional) */}
        <Field label="Email Address *" error={errors.email}>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email",
              },
            })}
            type="email"
            placeholder="john.doe@example.com"
            className={`input-field ${errors.email ? "input-error" : ""}`}
          />
        </Field>

        {/* Is Foreigner */}
        <Field label="Is Foreigner *" error={errors.isForeigner}>
          <select
            {...register("isForeigner", { required: "Please select an option" })}
            className={`input-field ${errors.isForeigner ? "input-error" : ""}`}
          >
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </Field>

        {/* Foreigner Conditional Fields */}
        {isForeigner === "1" && (
          <div className="border border-primary-100 bg-primary-50/10 p-5 rounded-2xl space-y-5 fade-up">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
              Foreigner Details
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Permanent Country *" error={errors.permanentCountry}>
                <select
                  {...register("permanentCountry", {
                    required: isForeigner === "1" ? "Permanent country is required" : false,
                  })}
                  className={`input-field ${errors.permanentCountry ? "input-error" : ""}`}
                  disabled={loadingCountries}
                >
                  <option value="">
                    {loadingCountries ? "Loading countries..." : "Select Country"}
                  </option>
                  {countries.map((country) => {
                    const cleanName = country.Name ? country.Name.trim() : "";
                    const displayName = cleanName
                      ? cleanName
                          .split(/\s+/)
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                          .join(" ")
                      : "";
                    return (
                      <option key={country.CountryID} value={cleanName}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </Field>

              <Field label="Foreigner Type *" error={errors.foreignerType}>
                <select
                  {...register("foreignerType", {
                    required: isForeigner === "1" ? "Foreigner type is required" : false,
                  })}
                  className={`input-field ${errors.foreignerType ? "input-error" : ""}`}
                >
                  <option value="">Select Type</option>
                  <option value="1">Foreigners Resident Expats</option>
                  <option value="2">Foreigners Tourists</option>
                  <option value="3">Foreigners Medical Travellers</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Passport No *" error={errors.passportNo}>
                <input
                  {...register("passportNo", {
                    required: isForeigner === "1" ? "Passport number is required" : false,
                  })}
                  type="text"
                  maxLength={20}
                  placeholder="Enter Passport Number"
                  className={`input-field ${errors.passportNo ? "input-error" : ""}`}
                />
              </Field>

              <Field label="International Phone No *" error={errors.internationalPhone}>
                <input
                  {...register("internationalPhone", {
                    required: isForeigner === "1" ? "International phone number is required" : false,
                    pattern: {
                      value: /^[+\d\s\-()]{7,20}$/,
                      message: "Enter a valid international phone number",
                    },
                  })}
                  type="tel"
                   maxLength={16}
                    onInput={(e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  }}
                  placeholder="+1 234 567 8900"
                  className={`input-field ${errors.internationalPhone ? "input-error" : ""}`}
                />
              </Field>
            </div>

            <Field label="Permanent Address *" error={errors.permanentAddress}>
              <textarea
                {...register("permanentAddress", {
                  required: isForeigner === "1" ? "Permanent address is required" : false,
                })}
                rows={2}
                placeholder="Street, City, Country Address"
                className={`input-field resize-none ${errors.permanentAddress ? "input-error" : ""}`}
              />
            </Field>
          </div>
        )}

        {/* Address */}
        <Field label="Address *" error={errors.address}>
          <textarea
            {...register("address", { required: "Address is required" })}
            rows={3}
            placeholder="Street, City, Region"
            className={`input-field resize-none ${errors.address ? "input-error" : ""}`}
          />
        </Field>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-2">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-4">
            Identity Documents
          </p>
          <div className="space-y-4">
            <FileUpload
              label="NIC / Passport / UID – Front *"
              name="nicFront"
              register={register}
              error={errors.nicFront}
              required
              cameraMode="card"
            />
            <FileUpload
              label="NIC / Passport / UID – Back *"
              name="nicBack"
              register={register}
              error={errors.nicBack}
              required
              cameraMode="card"
            />
            <FileUpload
              label="Patient Photo *"
              name="photo"
              register={register}
              required
              error={errors.photo}
              accept="image/*"
              cameraMode="face"
            />
          </div>
        </div>

        {/* Captcha */}
        <div className="border-t border-gray-100 pt-2">
          {loadingToken ? (
            <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ) : (
            <CaptchaBlock
              captchaImage={tokenData?.CaptchaImage}
              onRefresh={refetchToken}
              register={register}
              error={errors.captcha}
            />
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            ⚠ {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || loadingToken}
          className="btn-primary"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting…
            </span>
          ) : (
            "Complete Registration"
          )}
        </button>
      </form>
    </div>
  );
}
