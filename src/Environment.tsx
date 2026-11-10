import React from "react";
import { useCurrentFrame } from "remotion";

export type EnvironmentKind = "city" | "street" | "room" | "office" | "abstract";
type Props = { kind?: EnvironmentKind; accent?: string; seed?: number };

/** Procedural SVG environment with distant, middle and foreground depth planes. */
export const Environment: React.FC<Props> = ({ kind = "city", accent = "#FFD84D", seed = 1 }) => {
  const frame = useCurrentFrame();
  const drift = (frame % 360) / 360 * 28;
  const interior = kind === "room" || kind === "office";
  return (
    <g>
      <defs>
        <linearGradient id="sl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kind === "abstract" ? "#242B43" : "#C8DDF0"} />
          <stop offset="100%" stopColor="#FFF0D5" />
        </linearGradient>
        <linearGradient id="sl-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6D8C4" /><stop offset="100%" stopColor="#AFA18F" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#sl-sky)" />
      <circle cx="830" cy="500" r="115" fill={accent} opacity="0.3" />
      {interior ? (
        <g>
          <rect x="60" y="390" width="960" height="800" rx="24" fill="#E9DDCC" stroke="#B9A990" strokeWidth="14" />
          <rect x="125" y="470" width="330" height="430" fill="#AFCBDD" stroke="#FFF9EF" strokeWidth="18" />
          <path d="M 290 470 V 900 M 125 685 H 455" stroke="#FFF9EF" strokeWidth="14" />
          <rect x="665" y="480" width="220" height="520" rx="10" fill="#BFA98C" />
          <circle cx="850" cy="740" r="12" fill="#725B43" />
        </g>
      ) : (
        <>
          <g opacity="0.4" transform={`translate(${-drift * 0.2},0)`}>
            {Array.from({length:8},(_,i)=>{const x=i*165-20;const h=190+((i*61+seed*17)%210);return <g key={i}><rect x={x} y={1120-h} width="142" height={h} fill="#6C8199"/>{[0,1,2,3,4,5].map(j=><rect key={j} x={x+18+(j%2)*58} y={1140-h+Math.floor(j/2)*48} width="22" height="25" fill="#FFF2CC" opacity=".7"/>)}</g>;})}
          </g>
          <path d="M 0 1100 Q 270 980 540 1090 T 1080 1070 V 1450 H 0Z" fill="#A8B59B" opacity=".8" />
          <g transform={`translate(${-drift},0)`} opacity=".5">
            {Array.from({length:10},(_,i)=><path key={i} d={`M ${i*130} 1150 l 40 320`} stroke="#7E806E" strokeWidth="8"/>)}
          </g>
        </>
      )}
      <rect x="0" y="1190" width="1080" height="730" fill="url(#sl-floor)" />
      <path d="M 0 1190 H 1080" stroke="#766E64" strokeWidth="12" opacity=".35" />
      <g opacity=".18" transform={`translate(${-drift*1.6},0)`}>
        {Array.from({length:12},(_,i)=><path key={i} d={`M ${i*120} 1210 l 55 710`} stroke="#655D53" strokeWidth="5"/>)}
      </g>
    </g>
  );
};
