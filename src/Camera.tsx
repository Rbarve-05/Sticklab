import React, { type ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export type CameraProps = {
  children: ReactNode;
  startFrame?: number;
  durationFrames?: number;
  scaleFrom?: number;
  scaleTo?: number;
  xFrom?: number;
  xTo?: number;
  yFrom?: number;
  yTo?: number;
};

/**
 * Animated SVG camera wrapper.
 * Coordinates are in the shared 1080x1920 scene space.
 * Positive x/y values move the scene right/down; scale zooms around frame center.
 */
export const Camera: React.FC<CameraProps> = ({
  children,
  startFrame = 0,
  durationFrames = 45,
  scaleFrom = 1,
  scaleTo = 1.15,
  xFrom = 0,
  xTo = 0,
  yFrom = 0,
  yTo = 0,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + Math.max(1, durationFrames)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  const scale = interpolate(progress, [0, 1], [scaleFrom, scaleTo]);
  const x = interpolate(progress, [0, 1], [xFrom, xTo]);
  const y = interpolate(progress, [0, 1], [yFrom, yTo]);

  return (
    <g transform={`translate(${540 + x}, ${960 + y}) scale(${scale}) translate(-540, -960)`}>
      {children}
    </g>
  );
};
