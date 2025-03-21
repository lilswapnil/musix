import React from "react";

export default function Albums({ albums }) {
  return (
    <div className='section-container'>
        <div className="section-heading">
            <div className="section-title">Albums</div>
        </div>
        
      <div className="albums-grid">
        {albums.map((album) => (
          <div key={album.id} className="album-card">
            <img src={album.images[0]?.url} alt={album.name} />
            <div className="album-info">
              <h3>{album.name}</h3>
              <p>{album.artists.map((artist) => artist.name).join(", ")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}