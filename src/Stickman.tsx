import React from "react";
import { useCurrentFrame } from "remotion";

export type StickmanAction = "idle" | "walk" | "run" | "jump";

export type StickmanProps = {
  x?: number;
  y?: number;
  scale?: number;
  speed?: number;
  action?: StickmanAction;
  stroke?: string;
  strokeWidth?: number;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Reusable procedural stickman. Coordinates are relative to the character's
 * hip origin (0, 0). The same component can be reused in any Remotion scene.
 */
export const Stickman: React.FC<StickmanProps> = ({
  x = 540,
  y = 850,
  scale = 1,
  speed = 1,
  action = "walk",
  stroke = "#111111",
  strokeWidth = 7,
}) => {
  const frame = useCurrentFrame();
  const t = (frame / 30) * speed;

  const phase = t * (action === "run" ? 13 : 7);
  const swing = action === "idle" ? 0 : Math.sin(phase);
  const bounce =
    action === "idle"
      ? Math.sin(t * 2) * 1.5
      : action === "jump"
        ? -Math.abs(Math.sin(phase * 0.5)) * 34
        : Math.abs(Math.sin(phase)) * (action === "run" ? 12 : 7);

  const legAngle = action === "idle" ? 0 : swing * (action === "run" ? 38 : 29);
  const armAngle = action === "idle" ? 0 : -swing * (action === "run" ? 34 : 25);

  const line = {
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <g transform={`translate(${x}, ${y + bounce}) scale(${scale})`}>
      {/* Rear arm */}
      <g transform={`rotate(${-armAngle}, 0, -78)`}>
        <path d="M 0 -78 L 0 -48 L 27 -22" {...line} />
      </g>

      {/* Legs: rotate around the hip so feet swing naturally */}
      <g transform={`rotate(${legAngle}, 0, 0)`}>
        <path d="M 0 0 L -5 40 L -15 76" {...line} />
      </g>
      <g transform={`rotate(${-legAngle}, 0, 0)`}>
        <path d="M 0 0 L 5 40 L 15 76" {...line} />
      </g>

      {/* Torso */}
      <path d="M 0 -98 L 0 0" {...line} />

      {/* Arms */}
      <g transform={`rotate(${armAngle}, 0, -78)`}>
        <path d="M 0 -78 L 0 -48 L -27 -22" {...line} />
      </g>

      {/* Head */}
      <circle cx="0" cy="-126" r="27" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />

      {/* Simple face: two eyes and a small mouth */}
      <circle cx="-9" cy="-130" r="2.5" fill={stroke} />
      <circle cx="9" cy="-130" r="2.5" fill={stroke} />
      <path d="M -6 -116 Q 0 -112 6 -116" {...line} strokeWidth={Math.max(2, strokeWidth * 0.45)} />
    </g>
  );
};
