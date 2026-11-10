import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

type Props = { text?: string; startFrame: number; durationInFrames: number };

/** High-contrast two-line captions with active-word emphasis. */
export const CaptionTrack: React.FC<Props> = ({ text = "", startFrame, durationInFrames }) => {
  const frame = useCurrentFrame();
  if (!text.trim()) return null;
  const words = text.trim().split(/\s+/);
  const lines: string[][] = [[]];
  words.forEach((word) => {
    const current = lines[lines.length - 1];
    const lineLength = current.join(" ").length;
    if (lineLength + word.length + (current.length ? 1 : 0) > 34 && lines.length < 2) lines.push([]);
    lines[lines.length - 1].push(word);
  });
  const local = Math.max(0, frame - startFrame);
  const active = Math.min(words.length - 1, Math.floor((local / Math.max(1, durationInFrames)) * words.length));
  const scale = interpolate(local, [0, 7], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let wordIndex = 0;
  return (
    <g transform={`translate(540,1580) scale(${scale})`}>
      <rect x="-455" y="-62" width="910" height="124" rx="24" fill="#101010" opacity=".9"/>
      {lines.map((line,lineIndex) => {
        const thisLine = line.map((word,index) => {
          const currentIndex = wordIndex++;
          return <tspan key={`${lineIndex}-${index}`} fill={currentIndex===active?"#FFD84D":"#FFFFFF"}>{word}{index<line.length-1?" ":""}</tspan>;
        });
        return <text key={lineIndex} x="0" y={lines.length===1?12:lineIndex===0?-8:34} textAnchor="middle" fontSize="32" fontWeight="800">{thisLine}</text>;
      })}
    </g>
  );
};
