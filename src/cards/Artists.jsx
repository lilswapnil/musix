import React from "react";

export default function Artists({ artists }) {
  return (
    <div className='section-container'>
        <div className="section-heading">
            <div className="section-title">Artists</div>
        </div>

    <div className="albums-grid">
      {artists.map((artist) => (
        <div key={artist.id} className="album-card">
          <img src={artist.images[0]?.url} alt={artist.name} style={{width: '200px', height: '200px',borderRadius: '50%'}} />
          <div className="album-info">
            <h3>{artist.name}</h3>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}