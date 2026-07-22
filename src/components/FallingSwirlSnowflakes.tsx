import React from "react";
import { SWIRL_SNOWFLAKES } from "../utils/constants";

export function FallingSwirlSnowflakes() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {SWIRL_SNOWFLAKES.map((swirl) => (
        <svg
          key={swirl.id}
          viewBox="0 0 100 100"
          className="falling-swirl"
          style={{
            "--left-pos": `${(swirl.id * 2.85) % 100}%`,
            "--swirl-size": `${12 + (swirl.id * 7) % 20}px`,
            "--fall-duration": `${12 + (swirl.id * 5) % 16}s`,
            "--fall-delay": `-${(swirl.id * 3.7) % 24}s`,
            "--sway-distance": `${-35 + (swirl.id * 21) % 71}px`,
            "--swirl-opacity": (0.04 + ((swirl.id * 3) % 8) * 0.015).toFixed(3),
            "--rotate-degree": `${180 + (swirl.id * 85) % 360}deg`,
            fill: "currentColor",
          } as React.CSSProperties}
        >
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <circle cx="50" cy="22" r="5.5" />
              <path d="M 45,30 C 51,31 55,36 54,42 C 53,47 48,50 43,47 C 47,45 50,41 50,37 C 50,33 48,31 45,30 Z" />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}
