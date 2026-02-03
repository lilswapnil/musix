import React from "react";

export default function LibraryError({ message, onLogin }) {
  return (
    <div className="p-6 bg-error/10 border border-error/20 rounded-lg text-center my-8">
      <p className="text-error mb-2">{message}</p>
      <button
        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
        onClick={onLogin}
      >
        Log In
      </button>
    </div>
  );
}
