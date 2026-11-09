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

/** Reusable expressive stickman with a front-facing, articulated gait. */
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
  const phase = t * (running ? 10 : 6.5);
  const cycle = Math.sin(phase);
  const oppositeCycle = Math.sin(phase + Math.PI);

  // Front-view gait: thighs alternate, knees flex only during the forward swing.
  const strideAngle = running ? 30 : 20;
  const leftHip = moving ? cycle * strideAngle : 0;
  const rightHip = moving ? oppositeCycle * strideAngle : 0;
  const kneeFlex = running ? 34 : 25;
  const leftKnee = moving
    ? (cycle > 0 ? -1 : 1) * Math.max(0, Math.cos(phase)) * kneeFlex
    : 0;
  const rightKnee = moving
    ? (oppositeCycle > 0 ? -1 : 1) *
      Math.max(0, Math.cos(phase + Math.PI)) *
      kneeFlex
    : 0;

  // Arms counter-swing with the legs, with a small natural elbow bend.
  const leftArm = moving ? -leftHip * 0.8 : 0;
  const rightArm = moving ? -rightHip * 0.8 : 0;
  const armElbow = moving ? 12 : 8;

  const bounce =
    action === "idle"
      ? Math.sin(t * 2) * 1.5
      : action === "jump"
        ? -Math.abs(Math.sin(phase * 0.5)) * 42
        : moving
          ? Math.abs(Math.sin(phase * 2)) * (running ? 4 : 2)
          : 0;

  const bodyRotation =
    action === "fall" ? 72 : running ? -7 : action === "jump" ? -5 : 0;
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

  const renderLeg = (hipAngle: number, kneeAngle: number, side: -1 | 1) => (
    <g transform={`rotate(${hipAngle}, 0, 0)`}>
      <path d="M 0 0 L 0 39" {...line} />
      <g transform={`translate(0, 39) rotate(${kneeAngle})`}>
        <path d="M 0 0 L 0 36" {...line} />
        <path
          d={side < 0 ? "M 0 36 L -13 39" : "M 0 36 L 13 39"}
          {...line}
          strokeWidth={strokeWidth + 1}
        />
      </g>
    </g>
  );

  const renderArm = (angle: number, side: -1 | 1) => (
    <g transform={`translate(0, -78) rotate(${angle})`}>
      <path d="M 0 0 L 0 27" {...line} />
      <g transform={`translate(0, 27) rotate(${side * armElbow})`}>
        <path d="M 0 0 L 0 27" {...line} />
        <circle cx="0" cy="27" r="5" fill={accent} stroke={stroke} strokeWidth={2.5} />
      </g>
    </g>
  );

  return (
    <g transform={`translate(${x}, ${y + bounce})`}>
      <g transform={`rotate(${bodyRotation}, 0, -48) scale(${scale})`}>
        {renderLeg(leftHip, leftKnee, -1)}
        {renderLeg(rightHip, rightKnee, 1)}

        <path d="M 0 -98 L 0 0" {...line} strokeWidth={strokeWidth + 11} />
        <path
          d="M 0 -92 L 0 -8"
          fill="none"
          stroke={accent}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
        />

        {action === "jump" || action === "fall" ? (
          <>
            <g transform="translate(0, -78) rotate(-72)">
              <path d="M 0 0 L 0 28 L -18 48" {...line} />
            </g>
            <g transform="translate(0, -78) rotate(72)">
              <path d="M 0 0 L 0 28 L 18 48" {...line} />
            </g>
          </>
        ) : (
          <>
            {renderArm(leftArm, -1)}
            {renderArm(rightArm, 1)}
          </>
        )}

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
