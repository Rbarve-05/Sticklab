import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

type Props = { text?: string; startFrame: number; durationInFrames: number };

const wordWeight = (word: string) => {
  const letters = word.replace(/[^a-z0-9']/gi, "").length;
  const punctuationPause = /[.!?]$/.test(word) ? 1.8 : /[,;:]$/.test(word) ? 1.25 : 1;
  return Math.max(1, letters) * punctuationPause;
};

/** Two-line cinematic captions with weighted word timing and active-word emphasis. */
export const CaptionTrack: React.FC<Props> = ({ text = "", startFrame, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cleanText = text.trim();
  if (!cleanText) return null;

  const words = cleanText.split(/\s+/);
  const weights = words.map(wordWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const local = Math.max(0, frame - startFrame);
  const progress = Math.min(0.999, Math.max(0, local / Math.max(1, durationInFrames)));
  let cursor = 0;
  let active = 0;
  for (let i = 0; i < weights.length; i++) {
    cursor += weights[i] / totalWeight;
    if (progress < cursor) { active = i; break; }
    active = i;
  }

  const scale = interpolate(local, [0, 8], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const lines: string[][] = [[]];
  words.forEach((word) => {
    const current = lines[lines.length - 1];
    const currentLength = current.join(" ").length;
    if (currentLength + word.length + (current.length ? 1 : 0) > 32 && lines.length < 2) lines.push([]);
    lines[lines.length - 1].push(word);
  });

  let wordIndex = 0;
  return (
    <g transform={`translate(540,1580) scale(${scale})`}>
      <rect x="-470" y="-72" width="940" height="144" rx="22" fill="#05070B" opacity=".88" />
      {lines.map((line, lineIndex) => {
        const lineWords = line.map((word, index) => {
          const indexInSentence = wordIndex++;
          return (
            <tspan key={`${lineIndex}-${index}`}
              fill={indexInSentence === active ? "#FFD84D" : "#FFFFFF"}
              fontWeight={indexInSentence === active ? 900 : 750}>
              {word}{index < line.length - 1 ? " " : ""}
            </tspan>
          );
        });
        return (
          <text key={lineIndex} x="0" y={lines.length === 1 ? 12 : lineIndex === 0 ? -10 : 38}
            textAnchor="middle" fontSize="36" fontFamily="Arial, sans-serif" fontWeight="800"
            letterSpacing=".2">
            {lineWords}
          </text>
        );
      })}
    </g>
  );
};
