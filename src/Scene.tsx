import React, { type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type SceneProps = {
  title: string;
  subtitle?: string;
  background?: string;
  accent?: string;
  floorY?: number;
  children: ReactNode;
};

/**
 * Shared vertical scene layout for STICKLAB.
 * Place characters and props inside the SVG coordinate space (1080x1920).
 */
export const Scene: React.FC<SceneProps> = ({
  title,
  subtitle,
  background = "#FAFAFA",
  accent = "#FFD84D",
  floorY = 1190,
  children,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: background, fontFamily: "Arial, sans-serif" }}>
      <svg
        viewBox="0 0 1080 1920"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <rect width="1080" height="1920" fill={background} />
        <circle cx="540" cy="930" r="300" fill={accent} opacity={0.12} />

        <text
          x="540"
          y="170"
          textAnchor="middle"
          fontSize="48"
          fontWeight="800"
          letterSpacing="5"
          fill="#171717"
        >
          {title}
        </text>
        {subtitle && (
          <text x="540" y="225" textAnchor="middle" fontSize="25" fill="#777777">
            {subtitle}
          </text>
        )}

        <line
          x1="130"
          y1={floorY}
          x2="950"
          y2={floorY}
          stroke="#D4D4D4"
          strokeWidth="4"
        />

        {children}

        <text x="540" y="1810" textAnchor="middle" fontSize="22" fill="#999999">
          STICKLAB · FRAME {frame}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
