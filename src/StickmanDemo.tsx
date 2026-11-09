import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Stickman, StickmanExpression } from "./Stickman";

const expressionSequence: StickmanExpression[] = [
  "happy",
  "shocked",
  "sad",
  "angry",
];

const expressionLabels = ["HAPPY", "SHOCKED", "SAD", "ANGRY"];

export const StickmanDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = (frame / 30).toFixed(1);
  const expressionIndex = Math.min(3, Math.floor(frame / 75));
  const expression = expressionSequence[expressionIndex];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FAFAFA",
        fontFamily: "Arial, sans-serif",
        color: "#171717",
      }}
    >
      <svg
        viewBox="0 0 1080 1920"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <text x="540" y="170" textAnchor="middle" fontSize="48" fontWeight="800" letterSpacing="5">
          STICKLAB
        </text>
        <text x="540" y="225" textAnchor="middle" fontSize="25" fill="#777777">
          EXPRESSIVE CHARACTER ENGINE
        </text>

        <rect x="350" y="330" width="380" height="76" rx="38" fill="#171717" />
        <text
          x="540"
          y="379"
          textAnchor="middle"
          fontSize="27"
          fontWeight="700"
          letterSpacing="3"
          fill="#FFD84D"
        >
          {expressionLabels[expressionIndex]}
        </text>

        <circle cx="540" cy="930" r="300" fill="#FFF4C7" opacity="0.55" />
        <line
          x1="130"
          y1="1190"
          x2="950"
          y2="1190"
          stroke="#D4D4D4"
          strokeWidth="4"
        />

        <Stickman
          x={540}
          y={1080}
          scale={2.1}
          speed={1}
          action="walk"
          expression={expression}
        />

        <text x="540" y="1320" textAnchor="middle" fontSize="26" fill="#777777">
          One character · Four emotions
        </text>
        <text x="540" y="1810" textAnchor="middle" fontSize="22" fill="#999999">
          Frame {frame} · {seconds}s
        </text>
      </svg>
    </AbsoluteFill>
  );
};
