import React from "react";
import { useCurrentFrame } from "remotion";
import { Camera } from "./Camera";
import { Scene } from "./Scene";
import { Stickman } from "./Stickman";
import { Phone, SpeechBubble, Table } from "./Props";

export const StickmanDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = frame >= 150;

  return (
    <Scene
      title="STICKLAB"
      subtitle="CAMERA + MULTI-CHARACTER SCENE"
      floorY={1210}
    >
      <Camera
        startFrame={90}
        durationFrames={60}
        scaleFrom={1}
        scaleTo={1.16}
        xTo={0}
        yTo={-18}
      >
        <rect x="90" y="470" width="900" height="650" rx="44" fill="#FFF8DF" opacity="0.55" />
        <circle cx="540" cy="710" r="190" fill="#FFD84D" opacity="0.12" />

        <SpeechBubble
          x={540}
          y={650}
          text={reveal ? "WHO SENT IT?" : "NEW MESSAGE!"}
        />

        <Stickman
          x={315}
          y={1090}
          scale={1.35}
          action="idle"
          expression={reveal ? "shocked" : "happy"}
        />
        <Stickman
          x={765}
          y={1090}
          scale={1.35}
          action="idle"
          expression={reveal ? "happy" : "shocked"}
        />

        <Table x={540} y={1080} scale={0.82} />
        <Phone x={540} y={1025} scale={0.82} />
      </Camera>

      <text x="540" y="1390" textAnchor="middle" fontSize="27" fontWeight="700" fill="#171717">
        TWO CHARACTERS · ONE SHARED SCENE
      </text>
      <text x="540" y="1435" textAnchor="middle" fontSize="22" fill="#777777">
        Smooth camera push-in · Dialogue · Expressions · Props
      </text>
    </Scene>
  );
};
