import React from "react";

export function FlowRhLogo({
  size = "text-xl",
  textColor = "text-white",
  iconSize = "h-7"
}: {
  size?: string;
  textColor?: string;
  iconSize?: string;
}) {
  return (
    <div className="flex items-center select-none font-sans">
      <div className="flex items-center gap-1.5">
        <span className={`${size} font-black tracking-tight ${textColor} uppercase`}>FL</span>
        <svg
          viewBox="0 0 100 100"
          className={`${iconSize} shrink-0 animate-[spin_60s_linear_infinite]`}
          style={{ fill: "currentColor" }}
        >
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <circle cx="50" cy="22" r="5.5" />
              <path d="M 45,30 C 51,31 55,36 54,42 C 53,47 48,50 43,47 C 47,45 50,41 50,37 C 50,33 48,31 45,30 Z" />
            </g>
          ))}
        </svg>
        <span className={`${size} font-black tracking-tight ${textColor} uppercase`}>W</span>
        <span className="text-[9px] font-bold tracking-widest ml-1 self-center uppercase bg-white/15 px-1 py-0.5 rounded text-white border border-white/10 select-none leading-none">
          RH
        </span>
      </div>
    </div>
  );
}
