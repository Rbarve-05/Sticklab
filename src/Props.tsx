import React from "react";

export type PositionedPropProps = {
  x: number;
  y: number;
  scale?: number;
};

/** Simple reusable smartphone prop, drawn in the shared SVG scene coordinates. */
export const Phone: React.FC<PositionedPropProps> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-34" y="-62" width="68" height="124" rx="12" fill="#171717" />
    <rect x="-28" y="-52" width="56" height="104" rx="7" fill="#FFFDF5" />
    <rect x="-9" y="-46" width="18" height="3" rx="1.5" fill="#777777" />
    <circle cx="0" cy="44" r="3" fill="#FFD84D" />
    <rect x="-17" y="-24" width="34" height="5" rx="2.5" fill="#FFD84D" />
    <rect x="-17" y="-12" width="25" height="4" rx="2" fill="#D7D7D7" />
    <rect x="-17" y="-2" width="31" height="4" rx="2" fill="#D7D7D7" />
  </g>
);

/** Reusable speech bubble with a small pointer. */
export const SpeechBubble: React.FC<{
  x: number;
  y: number;
  text: string;
  accent?: string;
}> = ({ x, y, text, accent = "#FFD84D" }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-104" y="-38" width="208" height="76" rx="22" fill="#FFFFFF" stroke="#171717" strokeWidth="4" />
    <path d="M -14 38 L 0 54 L 14 38" fill="#FFFFFF" stroke="#171717" strokeWidth="4" strokeLinejoin="round" />
    <path d="M -12 37 L 0 49 L 12 37" fill="none" stroke="#FFFFFF" strokeWidth="5" />
    <rect x="-82" y="-7" width="164" height="14" rx="7" fill={accent} opacity="0.28" />
    <text x="0" y="9" textAnchor="middle" fontSize="24" fontWeight="700" fill="#171717">
      {text}
    </text>
  </g>
);

/** Small table prop for staging objects between characters. */
export const Table: React.FC<PositionedPropProps> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-112" y="-12" width="224" height="18" rx="7" fill="#171717" />
    <path d="M -82 6 L -92 100 M 82 6 L 92 100" stroke="#171717" strokeWidth="12" strokeLinecap="round" />
    <path d="M -82 18 L 82 18" stroke="#FFD84D" strokeWidth="8" strokeLinecap="round" />
  </g>
);
