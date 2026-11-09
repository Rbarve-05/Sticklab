import React from "react";
import { useCurrentFrame } from "remotion";
import { Scene } from "./Scene";
import { Stickman, type StickmanExpression } from "./Stickman";

const expressionSequence: StickmanExpression[] = [
  "happy",
  "shocked",
  "sad",
  "angry",
];

const expressionLabels = ["HAPPY", "SHOCKED", "SAD", "ANGRY"];

export const StickmanDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const expressionIndex = Math.min(3, Math.floor(frame / 75));
  const expression = expressionSequence[expressionIndex];

  return (
    <Scene title="STICKLAB" subtitle="EXPRESSIVE CHARACTER + SCENE ENGINE">
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

      <Stickman
        x={540}
        y={1080}
        scale={2.1}
        speed={1}
        action="walk"
        expression={expression}
      />

      <text x="540" y="1320" textAnchor="middle" fontSize="26" fill="#777777">
        Articulated walk cycle · Four emotions
      </text>
    </Scene>
  );
};
