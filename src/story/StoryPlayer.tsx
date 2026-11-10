import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { Camera } from "../Camera";
import { CaptionTrack } from "../CaptionTrack";
import { Environment } from "../Environment";
import { Phone, SpeechBubble, Table } from "../Props";
import { Scene } from "../Scene";
import { Stickman } from "../Stickman";
import { compileStory } from "./StoryEngine";
import { generatedStory, hasGeneratedSfx, hasGeneratedVoiceover } from "./generatedStory";
import { getShotAtFrame, planCinematicShots } from "./CinematicDirector";

const compiledStory = compileStory(generatedStory);

/** Cinematic renderer: procedural environments, editorial shot cuts, captions and SFX. */
export const StoryPlayer: React.FC = () => {
  const frame = useCurrentFrame();
  const activeScene = compiledStory.scenes.find(
    (scene) => frame >= scene.startFrame && frame < scene.endFrame,
  ) ?? compiledStory.scenes[compiledStory.scenes.length - 1];
  if (!activeScene) return null;

  const shots = planCinematicShots(activeScene);
  const shot = getShotAtFrame(shots, frame);
  const dialogue = activeScene.dialogue?.[0];
  const speaker = dialogue ? activeScene.characters.find((character) => character.id === dialogue.characterId) : undefined;
  const sceneFrame = frame - activeScene.startFrame;
  const fadeIn = Math.min(1, sceneFrame / 8);
  const fadeOut = Math.min(1, (activeScene.endFrame - frame) / 7);
  const transitionOpacity = Math.max(0, 1 - Math.min(fadeIn, fadeOut));

  return (
    <>
      <Scene title={compiledStory.title.toUpperCase()}
        subtitle={`${activeScene.id.toUpperCase()} / ${shot.framing.toUpperCase()} SHOT`}
        background={activeScene.background ?? "#FAFAFA"} floorY={1210}>
        <Camera startFrame={shot.startFrame} durationFrames={shot.durationInFrames}
          scaleFrom={shot.scaleFrom} scaleTo={shot.scaleTo}
          xFrom={shot.xFrom} xTo={shot.xTo} yFrom={shot.yFrom} yTo={shot.yTo}>
          <Environment kind={activeScene.environment ?? (activeScene.id.toLowerCase().includes("office") ? "office" : "city")}
            seed={compiledStory.scenes.indexOf(activeScene) + 1} />
          {activeScene.props?.map((prop) => prop.type === "phone"
            ? <Phone key={prop.id} x={prop.x} y={prop.y} scale={prop.scale} />
            : <Table key={prop.id} x={prop.x} y={prop.y} scale={prop.scale} />)}
          {activeScene.characters.map((character) => (
            <Stickman key={character.id} x={character.x} y={character.y}
              scale={character.scale} action={character.action} expression={character.expression} />
          ))}
          {dialogue && speaker && <SpeechBubble x={speaker.x} y={speaker.y - 310} text={dialogue.text} />}
        </Camera>
        <CaptionTrack text={activeScene.narration} startFrame={activeScene.startFrame}
          durationInFrames={activeScene.durationInFrames} />
        <text x="540" y="1740" textAnchor="middle" fontSize="20" fill="#FFFFFF" opacity="0.85">
          {shot.id.toUpperCase()} · {compiledStory.scenes.indexOf(activeScene) + 1}/{compiledStory.scenes.length}
        </text>
        {transitionOpacity > 0 && <rect x="0" y="0" width="1080" height="1920" fill="#08090D" opacity={transitionOpacity * 0.88} />}
      </Scene>
      {hasGeneratedVoiceover && <Audio src={staticFile("audio/voiceover.wav")} volume={1} />}
      {hasGeneratedSfx && <Audio src={staticFile("audio/story-sfx.wav")} volume={0.72} /> }
    </>
  );
};
