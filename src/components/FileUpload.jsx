import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  FolderOpen,
  Eye,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import CameraModal from "./CameraModal";
import ImagePreviewModal from "./ImagePreviewModal";

export default function FileUpload({
  label,
  name,
  register,
  error,
  accept = "image/*,.pdf",
  required = false,
  cameraMode = "card", // "card" for NIC, "face" for patient photo
}) {
  const [fileObject, setFileObject] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Register field with react-hook-form
  const {
    ref: registerRef,
    onChange,
    ...rest
  } = register(name, {
    required: required ? `${label} is required` : false,
  });

  // Merge refs so both fileInputRef and react-hook-form's ref point to the input element
  const setRefs = (element) => {
    fileInputRef.current = element;
    registerRef(element);
  };

  // Track file object changes to update preview and UI
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileObject(file);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl("");
      }
    } else {
      setFileObject(null);
      setPreviewUrl("");
    }
    onChange(e);
  };

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle image capture from camera
  const handleCameraCapture = (file) => {
    setFileObject(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Update input element's files programmatically
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      // Trigger react-hook-form onChange handler
      const event = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  // Clear/Delete uploaded file
  const handleClearFile = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      // Trigger react-hook-form onChange handler
      const event = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }

    setFileObject(null);
    setPreviewUrl("");
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const isImage =
    fileObject?.type.startsWith("image/") ||
    (!fileObject && accept.includes("image"));

  return (
    <div className="space-y-2">
      <label className="label flex items-center justify-between">
        <span>{label}</span>
        {/* {required && <span className="text-[10px] text-red-500 font-semibold tracking-normal uppercase">Required</span>} */}
      </label>

      {/* Main Container */}
      <div className="relative">
        <input
          id={name}
          type="file"
          accept={accept}
          className="hidden"
          ref={setRefs}
          onChange={handleFileChange}
          {...rest}
        />

        {!fileObject ? (
          // NO FILE SELECTED STATE
          <div
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 bg-white
              ${
                error
                  ? "border-red-400 bg-red-50/30 hover:border-red-500"
                  : "border-gray-200 hover:border-primary-400 hover:shadow-sm"
              }`}
          >
            <p className="text-xs text-gray-400 mb-4 font-body leading-relaxed">
              Take a live photo using camera or choose a local document
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto">
              {/* Camera Capture Button */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 bg-primary-50 text-primary-600 hover:bg-primary-100/80 hover:text-primary-700 text-xs font-semibold tracking-wide transition-all duration-200"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Take Photo</span>
              </button>

              {/* Folder/File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700 text-xs font-semibold tracking-wide transition-all duration-200"
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        ) : (
          // FILE UPLOADED STATE
          <div
            className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 bg-white transition-all duration-200
              ${error ? "border-red-400 bg-red-50/20" : "border-primary-100 bg-primary-50/20"}`}
          >
            {/* Left Section: Icon or Thumbnail + Details */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {previewUrl ? (
                <div
                  className="relative group cursor-pointer w-12 h-12 rounded-lg overflow-hidden border border-primary-200 shrink-0 shadow-sm"
                  onClick={() => setIsPreviewOpen(true)}
                  title="Click to view full preview"
                >
                  <img
                    src={previewUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs font-medium text-gray-700 truncate leading-none">
                    {fileObject.name}
                  </p>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] font-mono text-gray-400 leading-none">
                  {formatFileSize(fileObject.size)}
                </p>
              </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="p-2 rounded-xl text-primary-500 hover:bg-primary-50 border border-transparent hover:border-primary-100 transition-all duration-150"
                  title="View full image preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleClearFile}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-150"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="error-msg text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{error.message}</span>
        </p>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        mode={cameraMode}
      />

      {/* Image Preview Modal */}
      {previewUrl && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          imageSrc={previewUrl}
          fileName={fileObject?.name}
        />
      )}
    </div>
  );
}
