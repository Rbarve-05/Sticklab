import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Stickman } from "./Stickman";

export const StickmanDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = (frame / 30).toFixed(1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#fafafa",
        fontFamily: "Arial, sans-serif",
        color: "#111111",
      }}
    >
      <svg
        viewBox="0 0 1080 1920"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <text x="540" y="170" textAnchor="middle" fontSize="44" fontWeight="700">
          STICKLAB
        </text>
        <text x="540" y="225" textAnchor="middle" fontSize="25" fill="#666666">
          Character test · Walk cycle
        </text>

        <line x1="130" y1="1160" x2="950" y2="1160" stroke="#d4d4d4" strokeWidth="4" />
        <Stickman x={540} y={1080} scale={2.1} speed={1} action="walk" />

        <text x="540" y="1270" textAnchor="middle" fontSize="24" fill="#777777">
          Deterministic SVG animation
        </text>
        <text x="540" y="1810" textAnchor="middle" fontSize="22" fill="#999999">
          Frame {frame} · {seconds}s
        </text>
      </svg>
    </AbsoluteFill>
  );
};
