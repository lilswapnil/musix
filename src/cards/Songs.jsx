import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

export default function Songs({ songs }) {
  // Split songs into groups of 4
  const groupedSongs = [];
  for (let i = 0; i < songs.length; i += 4) {
    groupedSongs.push(songs.slice(i, i + 4));
  }

  return (
    <div className='section-container'>
      <div className="grid-scroll-container">
        {groupedSongs.map((group, groupIndex) => (
          <div key={groupIndex} className="section-group">
            {group.map((song) => (
              <div key={song.id} className="section-content-container">
                <div className="info">
                  <div className="content-image">
                    <img src={song.album.images[0]?.url} alt={song.name} />
                  </div>
                  <div className="content-information">
                    <div className="content-song">{song.name}</div>
                    <div className="content-artist">{song.artists.map((artist) => artist.name).join(", ")}</div>
                  </div>
                </div>
                <div className="like">
                <button className="like-button">
                  <FontAwesomeIcon icon={faHeart} />
                </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}