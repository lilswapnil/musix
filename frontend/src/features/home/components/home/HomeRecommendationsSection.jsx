import React from "react";
import AIRecommendations from "../../../library/components/ai/AIRecommendations";

export default function HomeRecommendationsSection({ isSpotifyAuthenticated }) {
  if (!isSpotifyAuthenticated) return null;

  return <AIRecommendations mode="single" source="spotify" />;
}
