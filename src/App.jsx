import React from "react";
import Header from "./components/Header";
import RegistrationPage from "./pages/RegistrationPage";
import { ToastContainer } from "react-toastify";
export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />
      <Header />
      <main className="pb-16">
        <RegistrationPage />
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 font-body">
        © {new Date().getFullYear()} Healthcare. All rights reserved.
      </footer>
    </div>
  );
}
