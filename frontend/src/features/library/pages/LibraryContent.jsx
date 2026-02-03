import React from "react";
import SpotifyPlayer from "../../../components/player/SpotifyPlayer";
import CurrentlyPlaying from "../components/nowplaying/CurrentlyPlaying";
import RecentPlayed from "../components/recent/RecentPlayed";
import PersonalTop from "../components/personal/PersonalTop";

export default function LibraryContent({ token }) {
  return (
    <>
      <SpotifyPlayer />
      <CurrentlyPlaying token={token} />
      <RecentPlayed token={token} />
      <PersonalTop />
    </>
  );
}
