import React from "react";
import CurrentlyPlaying from "../components/nowplaying/CurrentlyPlaying";
import RecentPlayed from "../components/recent/RecentPlayed";
import PersonalTop from "../components/personal/PersonalTop";

export default function LibraryContent({ token }) {
  return (
    <>
      <CurrentlyPlaying token={token} />
      <RecentPlayed token={token} />
      <PersonalTop />
    </>
  );
}
