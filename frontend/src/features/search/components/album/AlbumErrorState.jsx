import React from "react";

export default function AlbumErrorState({ message, onGoBack }) {
  return (
    <div className="my-8 text-center">
      <div className="bg-primary-light/50 p-6 rounded-lg inline-block">
        <p className={message === "Album not found" ? "text-muted mb-4" : "text-red-400 mb-4"}>
          {message}
        </p>
        <button
          onClick={onGoBack}
          className="bg-accent hover:bg-accent/80 px-4 py-2 rounded-lg text-white"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
