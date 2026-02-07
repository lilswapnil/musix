import React from "react";

export default function AlbumVinylRecord({
  albumImage,
  artistImage,
  albumTitle,
  artistName
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        background: "transparent",
        padding: "40px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "none",
          backgroundSize: "30px 30px",
          opacity: 0
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          maxWidth: "1200px",
          width: "100%"
        }}
      >
        <div
          style={{
            position: "relative",
            width: "470px",
            height: "470px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 100%)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.35), inset 0 0 40px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.08), 0 0 60px rgba(255,255,255,0.1), inset -20px -20px 60px rgba(0,0,0,0.4), inset 20px 20px 60px rgba(255,255,255,0.05)",
            zIndex: 0,
            transform: "translateX(70px)"
          }}
        >
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${90 - i * 5}%`,
                height: `${90 - i * 5}%`,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.03)",
                pointerEvents: "none"
              }}
            />
          ))}

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "#f5f5f5",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 50%)",
                background: artistImage
                  ? `url(${artistImage})`
                  : "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: "25%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80%",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "600",
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "Arial, sans-serif",
                zIndex: 2
              }}
            >
              {artistName}
            </div>

            <div
              style={{
                position: "absolute",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #1a1a1a 0%, #000 100%)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
                zIndex: 3
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: "480px",
            height: "480px",
            marginLeft: "-80px",
            background: "#ffffff",
            boxShadow:
              "0 18px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(0,0,0,0.25)",
            zIndex: 1,
            overflow: "hidden",
            borderRadius: "0px"
          }}
        >
          {albumImage ? (
            <img
              src={albumImage}
              alt={albumTitle || "Album Cover"}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                color: "#999",
                fontSize: "24px",
                fontFamily: "Arial, sans-serif"
              }}
            >
              Album Cover
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
