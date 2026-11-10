import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

type Props = { text?: string; startFrame: number; durationInFrames: number };

/** High-contrast timed captions with active-word emphasis. */
export const CaptionTrack: React.FC<Props> = ({ text = "", startFrame, durationInFrames }) => {
  const frame = useCurrentFrame();
  if (!text.trim()) return null;
  const words = text.trim().split(/\s+/);
  const local = Math.max(0, frame - startFrame);
  const active = Math.min(words.length - 1, Math.floor((local / Math.max(1, durationInFrames)) * words.length));
  const scale = interpolate(local, [0, 7], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g transform={`translate(540,1580) scale(${scale})`}>
      <rect x="-455" y="-54" width="910" height="108" rx="24" fill="#101010" opacity=".9"/>
      <text x="0" y="12" textAnchor="middle" fontSize="35" fontWeight="800">
        {words.map((word,index)=><tspan key={index} fill={index===active?"#FFD84D":"#FFFFFF"}>{word}{index<words.length-1?" ":""}</tspan>)}
      </text>
    </g>
  );
};
