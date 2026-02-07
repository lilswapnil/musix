import React from "react";
import NewReleases from "../releases/NewReleases";

export default function HomeSpotifySection({ isSpotifyAuthenticated }) {
  if (!isSpotifyAuthenticated) return null;

  return (
    <>
      <NewReleases />
    </>
  );
}
