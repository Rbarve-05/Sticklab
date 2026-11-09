import type { StoryDocument } from "./types";

/**
 * Example only: the first authored story data contract.
 * The future AI story generator will produce this same structure.
 */
export const sampleStory: StoryDocument = {
  title: "The Mysterious Message",
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      id: "hook",
      durationSeconds: 4,
      narration: "He received a message from an unknown number.",
      characters: [
        { id: "alex", x: 315, y: 1090, scale: 1.35, action: "idle", expression: "happy" },
        { id: "sam", x: 765, y: 1090, scale: 1.35, action: "idle", expression: "neutral" },
      ],
      props: [
        { type: "table", id: "table", x: 540, y: 1080, scale: 0.82 },
        { type: "phone", id: "phone", x: 540, y: 1025, scale: 0.82 },
      ],
      dialogue: [{ characterId: "alex", text: "NEW MESSAGE!" }],
      camera: { scaleFrom: 1, scaleTo: 1.08 },
    },
    {
      id: "reveal",
      durationSeconds: 6,
      narration: "But the message came from someone standing right beside him.",
      characters: [
        { id: "alex", x: 315, y: 1090, scale: 1.35, action: "idle", expression: "shocked" },
        { id: "sam", x: 765, y: 1090, scale: 1.35, action: "idle", expression: "scared" },
      ],
      props: [
        { type: "table", id: "table", x: 540, y: 1080, scale: 0.82 },
        { type: "phone", id: "phone", x: 540, y: 1025, scale: 0.82 },
      ],
      dialogue: [{ characterId: "alex", text: "WHO SENT IT?" }],
      camera: { scaleFrom: 1.08, scaleTo: 1.18, yTo: -18 },
    },
  ],
};
