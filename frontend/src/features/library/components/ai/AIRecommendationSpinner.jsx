import React from "react";

export default function AIRecommendationSpinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent/50 rounded-full animate-spin"></div>
        <div className="absolute inset-1 glass-light rounded-full"></div>
      </div>
    </div>
  );
}
