import React from "react";
import { Composition } from "remotion";
import { StickmanDemo } from "./StickmanDemo";

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="StickmanDemo"
      component={StickmanDemo}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
