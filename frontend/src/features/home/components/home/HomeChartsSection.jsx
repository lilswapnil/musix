import React from "react";
import TrendingSongs from "../trending/TrendingSongs";
import TopAlbums from "../albums/TopAlbums";
import TopArtists from "../artists/TopArtists";

export default function HomeChartsSection() {
  return (
    <>
      <TrendingSongs />
      <TopAlbums />
      <TopArtists />
    </>
  );
}
