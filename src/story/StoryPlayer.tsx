import React from "react";
import { useCurrentFrame } from "remotion";
import { Camera } from "../Camera";
import { Phone, SpeechBubble, Table } from "../Props";
import { Scene } from "../Scene";
import { Stickman } from "../Stickman";
import { compileStory } from "./StoryEngine";
import { generatedStory } from "./generatedStory";

const compiledStory = compileStory(generatedStory);

/** Plays the active compiled story scene using the real Remotion components. */
export const StoryPlayer: React.FC = () => {
  const frame = useCurrentFrame();

  const activeScene =
    compiledStory.scenes.find(
      (scene) => frame >= scene.startFrame && frame < scene.endFrame,
    ) ?? compiledStory.scenes[compiledStory.scenes.length - 1];

  if (!activeScene) return null;

  const camera = activeScene.camera;
  const dialogue = activeScene.dialogue?.[0];
  const speakingCharacter = dialogue
    ? activeScene.characters.find(
        (character) => character.id === dialogue.characterId,
      )
    : undefined;

  return (
    <Scene
      title={compiledStory.title.toUpperCase()}
      subtitle={activeScene.id.toUpperCase()}
      background={activeScene.background ?? "#FAFAFA"}
      floorY={1210}
    >
      <Camera
        startFrame={activeScene.startFrame}
        durationFrames={Math.min(45, activeScene.durationInFrames)}
        scaleFrom={camera?.scaleFrom ?? 1}
        scaleTo={camera?.scaleTo ?? camera?.scaleFrom ?? 1}
        xFrom={camera?.xFrom ?? 0}
        xTo={camera?.xTo ?? camera?.xFrom ?? 0}
        yFrom={camera?.yFrom ?? 0}
        yTo={camera?.yTo ?? camera?.yFrom ?? 0}
      >
        <rect
          x="90"
          y="470"
          width="900"
          height="650"
          rx="44"
          fill="#FFF8DF"
          opacity="0.55"
        />
        <circle cx="540" cy="710" r="190" fill="#FFD84D" opacity="0.12" />

        {activeScene.props?.map((prop) => {
          if (prop.type === "phone") {
            return (
              <Phone
                key={prop.id}
                x={prop.x}
                y={prop.y}
                scale={prop.scale}
              />
            );
          }

          return (
            <Table
              key={prop.id}
              x={prop.x}
              y={prop.y}
              scale={prop.scale}
            />
          );
        })}

        {activeScene.characters.map((character) => (
          <Stickman
            key={character.id}
            x={character.x}
            y={character.y}
            scale={character.scale}
            action={character.action}
            expression={character.expression}
          />
        ))}

        {dialogue && speakingCharacter && (
          <SpeechBubble
            x={speakingCharacter.x}
            y={speakingCharacter.y - 310}
            text={dialogue.text}
          />
        )}
      </Camera>

      {activeScene.narration && (
        <text
          x="540"
          y="1450"
          textAnchor="middle"
          fontSize="25"
          fill="#555555"
        >
          {activeScene.narration}
        </text>
      )}

      <text
        x="540"
        y="1510"
        textAnchor="middle"
        fontSize="21"
        fontWeight="700"
        fill="#171717"
      >
        SCENE {compiledStory.scenes.indexOf(activeScene) + 1} /{" "}
        {compiledStory.scenes.length}
      </text>
    </Scene>
  );
};
