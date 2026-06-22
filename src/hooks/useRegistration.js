import { useState, useEffect, useCallback } from "react";
import { getDirectToken, saveOnlineRegistration, getCountryList } from "../services/api";
import { fileToBase64, buildRegistrationPayload, resizeImage } from "../utils/helpers";
import { aesDecrypt } from "../utils/crypto";
import { toast } from "react-toastify";

export function useRegistration() {
  const [tokenData, setTokenData] = useState(null);
  const [sessionId] = useState();
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState(null);
  useEffect(() => {
    if (tokenData) {
      const allKeys = Object.keys(tokenData);
      const matchedTokenKey = allKeys.find(key => key.toLowerCase().includes("token"));
      const resolvedAPIToken = matchedTokenKey ? tokenData[matchedTokenKey] : undefined;

      const { requestid, DeviceID, CaptchaText, EncryptCaptchaText } = tokenData;







    }
  }, [tokenData]);
  const fetchToken = useCallback(async () => {
    setLoadingToken(true);
    setTokenError(null);
    try {
      const data = await getDirectToken();// no args — encrypted inside api.js
      setTokenData(data);

    } catch (err) {
      setTokenError(err.message);
      toast.error("Failed to fetch token: " + err.message);
    } finally {
      setLoadingToken(false);
    }
  }, []);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true);
    setCountriesError(null);
    try {
      const data = await getCountryList();
      setCountries(data || []);
    } catch (err) {
      setCountriesError(err.message);
      toast.error("Failed to fetch country list: " + err.message);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const submitRegistration = useCallback(async (formData) => {
    if (!tokenData) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const compressedNicFront = formData.nicFront?.[0] ? await resizeImage(formData.nicFront[0]) : null;
      const compressedNicBack = formData.nicBack?.[0] ? await resizeImage(formData.nicBack[0]) : null;
      const compressedPhoto = formData.photo?.[0] ? await resizeImage(formData.photo[0]) : null;

      const nicFrontendB64 = compressedNicFront ? await fileToBase64(compressedNicFront) : "";
      const nicBackendB64 = compressedNicBack ? await fileToBase64(compressedNicBack) : "";
      const patientPhotoB64 = compressedPhoto ? await fileToBase64(compressedPhoto) : "";

      const payload = buildRegistrationPayload({
        formData,
        requestid: tokenData.requestid,
        captcha: formData.captcha,

        encryptCaptchaText: tokenData.EncryptCaptchaText,
        sessionId,
        nicFrontendB64,
        nicBackendB64,
        patientPhotoB64,
      });

      const allKeys = Object.keys(tokenData || {});
      const matchedTokenKey = allKeys.find(key => key.toLowerCase().includes("token"));
      const resolvedAPIToken = matchedTokenKey ? tokenData[matchedTokenKey] : undefined;

      await saveOnlineRegistration(payload, resolvedAPIToken);
      setSubmitSuccess(true);
      toast.success("Registration successful!");
    } catch (err) {
      setSubmitError(err.message);
      toast.error("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }, [tokenData, sessionId]);

  return {
    tokenData, loadingToken, tokenError,
    refetchToken: fetchToken,
    countries, loadingCountries, countriesError,
    submitting, submitError, submitSuccess,
    submitRegistration, setSubmitError,
  };
}
