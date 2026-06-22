import React, { useRef, useState, useEffect } from "react";
import { Camera, RotateCw, X, CameraOff } from "lucide-react";

export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
  mode = "card", // "card" for NIC, "face" for patient photo
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Stop the camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start the camera stream
  const startCamera = async (deviceId = "") => {
    setLoading(true);
    setError(null);
    stopCamera();

    const constraints = {
      audio: false,
      video: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
      },
    };

    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
    } else {
      // Default based on mode
      constraints.video.facingMode = mode === "face" ? "user" : "environment";
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate devices once we have permission to populate labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === "videoinput");
      setDevices(videoDevices);

      // Set the active device ID if not already set
      if (!deviceId && videoDevices.length > 0) {
        // Try to match the active track's device ID
        const activeTrack = stream.getVideoTracks()[0];
        const activeSettings = activeTrack?.getSettings();
        if (activeSettings?.deviceId) {
          setActiveDeviceId(activeSettings.deviceId);
        } else {
          setActiveDeviceId(videoDevices[0].deviceId);
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings to take a photo.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera device found on this system. Please check connection.");
      } else {
        setError(`Failed to open camera: ${err.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle stream startup on modal open
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  // Switch camera source
  const handleSwitchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    if (nextDevice) {
      setActiveDeviceId(nextDevice.deviceId);
      startCamera(nextDevice.deviceId);
    }
  };

  // Capture image frame
  const handleCapture = () => {
    if (!videoRef.current || loading || error) return;
    const video = videoRef.current;

    // Create canvas matching video's native resolution, but limit to max 1280px dimension to avoid huge images
    const canvas = document.createElement("canvas");
    const maxDimension = 1280;
    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontal if front camera ("user" facing) for natural preview matching
    const activeTrack = streamRef.current?.getVideoTracks()[0];
    const settings = activeTrack?.getSettings();
    const isFrontCamera = settings?.facingMode === "user" || 
      (devices.find(d => d.deviceId === activeDeviceId)?.label.toLowerCase().includes("front"));

    if (isFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File(
            [blob],
            `camera_capture_${mode}_${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );
          onCapture(file);
          onClose();
        }
      },
      "image/jpeg",
      0.85
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-400" />
            <h3 className="text-white font-semibold tracking-wide text-sm md:text-base">
              {mode === "face" ? "Take Patient Photo" : "Capture Identity Document"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center max-w-sm">
              <CameraOff className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 font-semibold mb-2 text-sm">Camera Error</p>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">{error}</p>
              <button
                onClick={() => startCamera(activeDeviceId)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-xs font-medium">Starting camera stream...</span>
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1] flip-camera"
                style={{
                  // Only mirror if it looks like a front camera
                  transform: (mode === "face" && activeDeviceId) ? "scaleX(-1)" : "none"
                }}
              />

              {/* Overlay Guidelines */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {mode === "card" ? (
                  // Document Card Guidelines (landscape outline)
                  <div className="w-[85%] h-[60%] border-[3px] border-dashed border-primary-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-black/75 px-3 py-1 rounded-full text-[10px] text-primary-300 font-medium uppercase tracking-wider border border-primary-500/20">
                        Align ID / Passport inside
                      </span>
                    </div>
                  </div>
                ) : (
                  // Face Guidelines (oval outline)
                  <div className="w-[60%] h-[75%] border-[3px] border-dashed border-accent rounded-full relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                      <span className="bg-black/75 px-3 py-1 rounded-full text-[10px] text-accent font-medium uppercase tracking-wider border border-accent/20 whitespace-nowrap">
                        Align face within oval
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-950 flex justify-between items-center gap-4">
          <div className="flex-1">
            {devices.length > 1 && !error && (
              <button
                onClick={handleSwitchCamera}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold transition-all duration-200"
              >
                <RotateCw className="w-4 h-4" />
                <span>Switch Camera</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex justify-center">
            {!error && !loading && (
              <button
                onClick={handleCapture}
                className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border-4 border-gray-800 hover:border-gray-700 shadow-lg active:scale-95 transition-all duration-150"
                aria-label="Capture photo"
              >
                <div className="w-7 h-7 rounded-full bg-primary-500 animate-pulse" />
              </button>
            )}
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
