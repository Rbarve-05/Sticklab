import React from "react";
import { useCurrentFrame } from "remotion";

export type StickmanAction = "idle" | "walk" | "run" | "jump" | "fall";
export type StickmanExpression =
  | "neutral"
  | "happy"
  | "sad"
  | "shocked"
  | "angry"
  | "scared";

export type StickmanProps = {
  x?: number;
  y?: number;
  scale?: number;
  speed?: number;
  action?: StickmanAction;
  expression?: StickmanExpression;
  stroke?: string;
  strokeWidth?: number;
  accent?: string;
};

/** Reusable expressive stickman built from deterministic SVG animation. */
export const Stickman: React.FC<StickmanProps> = ({
  x = 540,
  y = 850,
  scale = 1,
  speed = 1,
  action = "walk",
  expression = "happy",
  stroke = "#171717",
  strokeWidth = 7,
  accent = "#FFD84D",
}) => {
  const frame = useCurrentFrame();
  const t = (frame / 30) * speed;
  const running = action === "run";
  const moving = action === "walk" || running;
  const phase = t * (running ? 13 : 7);
  const swing = moving ? Math.sin(phase) : 0;

  const bounce =
    action === "idle"
      ? Math.sin(t * 2) * 1.5
      : action === "jump"
        ? -Math.abs(Math.sin(phase * 0.5)) * 42
        : moving
          ? Math.abs(Math.sin(phase)) * (running ? 13 : 7)
          : 0;

  const legAngle = moving ? swing * (running ? 42 : 30) : 0;
  const armAngle = moving ? -swing * (running ? 42 : 28) : 0;
  const bodyRotation =
    action === "fall" ? 72 : action === "run" ? -9 : action === "jump" ? -5 : 0;
  const armSpread = action === "fall" || action === "jump";
  const armLift = action === "fall" ? -115 : -75;

  const line = {
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const mouth = (() => {
    switch (expression) {
      case "happy":
        return <path d="M -9 -113 Q 0 -103 9 -113" {...line} strokeWidth={3.5} />;
      case "sad":
        return <path d="M -9 -108 Q 0 -118 9 -108" {...line} strokeWidth={3.5} />;
      case "shocked":
      case "scared":
        return <ellipse cx="0" cy="-109" rx="5" ry="8" fill={stroke} />;
      case "angry":
        return <path d="M -8 -108 L 8 -108" {...line} strokeWidth={3.5} />;
      default:
        return <path d="M -7 -110 L 7 -110" {...line} strokeWidth={3} />;
    }
  })();

  return (
    <g transform={`translate(${x}, ${y + bounce})`}>
      <g transform={`rotate(${bodyRotation}, 0, -48) scale(${scale})`}>
        {/* Legs and simple sneaker-like feet */}
        <g transform={`rotate(${legAngle}, 0, 0)`}>
          <path d="M 0 0 L -7 39 L -18 73" {...line} />
          <path d="M -18 73 L -29 76" {...line} strokeWidth={strokeWidth + 1} />
        </g>
        <g transform={`rotate(${-legAngle}, 0, 0)`}>
          <path d="M 0 0 L 7 39 L 18 73" {...line} />
          <path d="M 18 73 L 29 76" {...line} strokeWidth={strokeWidth + 1} />
        </g>

        {/* Signature accent-colored torso */}
        <path d="M 0 -98 L 0 0" {...line} strokeWidth={strokeWidth + 11} />
        <path
          d="M 0 -92 L 0 -8"
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
        />

        {/* Arms, with raised poses for jumping and falling */}
        <g transform={armSpread ? `rotate(${armLift}, 0, -78)` : `rotate(${armAngle}, 0, -78)`}>
          <path d="M 0 -78 L -2 -49 L -27 -25" {...line} />
          <circle cx="-27" cy="-25" r="5" fill={accent} stroke={stroke} strokeWidth={2.5} />
        </g>
        <g transform={armSpread ? `rotate(${-armLift}, 0, -78)` : `rotate(${-armAngle}, 0, -78)`}>
          <path d="M 0 -78 L 2 -49 L 27 -25" {...line} />
          <circle cx="27" cy="-25" r="5" fill={accent} stroke={stroke} strokeWidth={2.5} />
        </g>

        {/* Expressive face */}
        <circle cx="0" cy="-126" r="29" fill="#FFFFFF" stroke={stroke} strokeWidth={strokeWidth} />

        {expression === "angry" && (
          <path d="M -17 -139 L -5 -135 M 5 -135 L 17 -139" {...line} strokeWidth={3.5} />
        )}
        {(expression === "sad" || expression === "scared") && (
          <path d="M -17 -137 L -5 -140 M 5 -140 L 17 -137" {...line} strokeWidth={3.5} />
        )}

        {expression === "shocked" || expression === "scared" ? (
          <>
            <ellipse cx="-10" cy="-128" rx="4" ry="6" fill={stroke} />
            <ellipse cx="10" cy="-128" rx="4" ry="6" fill={stroke} />
          </>
        ) : (
          <>
            <circle cx="-10" cy="-129" r="3.2" fill={stroke} />
            <circle cx="10" cy="-129" r="3.2" fill={stroke} />
          </>
        )}

        {mouth}

        {expression === "happy" && (
          <>
            <circle cx="-20" cy="-111" r="3.5" fill="#F4A6A6" opacity={0.75} />
            <circle cx="20" cy="-111" r="3.5" fill="#F4A6A6" opacity={0.75} />
          </>
        )}
      </g>
    </g>
  );
};
