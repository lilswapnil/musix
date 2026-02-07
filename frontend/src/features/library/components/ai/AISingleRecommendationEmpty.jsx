import React from "react";

export default function AISingleRecommendationEmpty({ message }) {
  return (
    <div className="text-center p-8 glass-light rounded-lg">
      <p className="text-lg text-muted">No recommendation available</p>
      <p className="text-sm mt-2">{message}</p>
    </div>
  );
}
