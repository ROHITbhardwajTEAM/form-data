// src/utils/helpers.js

import { aesDecrypt } from "./crypto";

/**
 * Convert a File object to base64 string (without the data-URI prefix).
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate age based on Date of Birth string (YYYY-MM-DD) and current date.
 */
export function calculateAge(dobString) {
  if (!dobString) return "";
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
}

export function buildRegistrationPayload({
  formData,
  requestid,
  captcha,
  sessionId,
  nicFrontendB64,
  nicBackendB64,
  patientPhotoB64,
}) {

  const record = {
    FirstName: formData.firstName,
    LastName: formData.lastName,
    PatientDOB: formData.dob,
    Age: calculateAge(formData.dob),
    Gender: formData.gender,
    MobileNo: formData.mobile,
    EmailID: formData.email || "",
    Address: formData.address,
    RequestID: requestid,
    PatientPhoto: patientPhotoB64 || "",
    SessionID: requestid, // sessionId ko decrypt karo
    NicFrontend: nicFrontendB64 || "",
    NicBackend: nicBackendB64 || "",
    Captcha: captcha,
    IsForeigner: formData.isForeigner || "0",
    PassportNo: formData.passportNo || "",
    PermanentCountry: formData.permanentCountry || "",
    PermanentAddress: formData.permanentAddress || "",
    InternationalPhone: formData.internationalPhone || "",
    ForeignerType: formData.foreignerType || "",
  };

  return JSON.stringify([record]); // array of one record
}

/**
 * Resize image files to a maximum dimension (width/height) using HTML5 Canvas
 * and return a compressed JPEG File object.
 */
export function resizeImage(file, maxDimension = 1200) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.80 // compress quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}



