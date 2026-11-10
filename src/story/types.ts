import type { StickmanAction, StickmanExpression } from "../Stickman";

export type StoryCharacter = {
  id: string;
  x: number;
  y: number;
  scale?: number;
  action: StickmanAction;
  expression: StickmanExpression;
};

export type StoryProp =
  | { type: "phone"; id: string; x: number; y: number; scale?: number }
  | { type: "table"; id: string; x: number; y: number; scale?: number };

export type StoryDialogue = {
  characterId: string;
  text: string;
};

export type StoryCamera = {
  scaleFrom?: number;
  scaleTo?: number;
  xFrom?: number;
  xTo?: number;
  yFrom?: number;
  yTo?: number;
};

export type StoryScene = {
  environment?: "city" | "street" | "room" | "office" | "abstract";
  id: string;
  durationSeconds: number;
  background?: string;
  narration?: string;
  dialogue?: StoryDialogue[];
  characters: StoryCharacter[];
  props?: StoryProp[];
  camera?: StoryCamera;
};

export type StoryDocument = {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: StoryScene[];
};

export type CompiledStoryScene = StoryScene & {
  startFrame: number;
  durationInFrames: number;
  endFrame: number;
};

export type CompiledStory = {
  title: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  scenes: CompiledStoryScene[];
};

export type StoryValidationResult = {
  valid: boolean;
  errors: string[];
};
