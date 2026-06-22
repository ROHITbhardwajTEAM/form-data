import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageSrc,
  fileName,
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 backdrop-blur-md">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/60 border-b border-gray-800 text-white">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-primary-400 font-semibold uppercase tracking-wider">
            Document Preview
          </span>
          <h3 className="text-sm font-medium text-gray-200 truncate max-w-md">
            {fileName || "Image Preview"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
        <div 
          className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={imageSrc}
            alt={fileName || "Uploaded document preview"}
            className="max-w-[90vw] max-h-[70vh] rounded-lg shadow-2xl object-contain select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Toolbar / Footer controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-5 bg-gray-900/40 border-t border-gray-850">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="flex items-center justify-center p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900 transition-all duration-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-medium text-gray-400 px-2 min-w-16 text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={scale >= 3}
          className="flex items-center justify-center p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900 transition-all duration-200"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-800 mx-2" />

        <button
          onClick={handleRotate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 text-xs font-semibold"
          title="Rotate 90 degrees"
        >
          <RotateCcw className="w-4 h-4 scale-x-[-1]" />
          <span>Rotate</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 text-xs font-semibold"
          title="Reset View"
        >
          <span>Reset</span>
        </button>
      </div>

    </div>
  );
}
