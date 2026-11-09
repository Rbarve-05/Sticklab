import React from "react";
import { Composition } from "remotion";
import { StoryPlayer } from "./story/StoryPlayer";
import { compileStory } from "./story/StoryEngine";
import { generatedStory } from "./story/generatedStory";

const compiledStory = compileStory(generatedStory);

export const MyComposition: React.FC = () => {
  return (
    <Composition
      id="StickmanDemo"
      component={StoryPlayer}
      durationInFrames={compiledStory.durationInFrames}
      fps={compiledStory.fps}
      width={compiledStory.width}
      height={compiledStory.height}
    />
  );
};
