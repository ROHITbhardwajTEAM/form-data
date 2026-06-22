import React from "react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <img
            src="/Logo.png"
            alt="C-Care Logo"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </div>
      </div>
    </header>
  );
}
