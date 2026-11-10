import type { CompiledStoryScene } from "./types";

export type CinematicShot = {
  id: string; startFrame: number; durationInFrames: number;
  framing: "wide" | "medium" | "close";
  movement: "push-in" | "pull-out" | "pan-left" | "pan-right";
  scaleFrom: number; scaleTo: number; xFrom: number; xTo: number; yFrom: number; yTo: number;
};

/** Generates a deterministic 2-4 shot edit for every story scene. */
export const planCinematicShots = (scene: CompiledStoryScene): CinematicShot[] => {
  const count = Math.max(2, Math.min(4, Math.ceil(scene.durationSeconds / 2.8)));
  const weights = count === 2 ? [0.42, 0.58] : count === 3 ? [0.28, 0.36, 0.36] : [0.22, 0.26, 0.26, 0.26];
  const framings: CinematicShot["framing"][] = ["wide", "medium", "close", "medium"];
  const movements: CinematicShot["movement"][] = ["push-in", "pan-left", "push-in", "pull-out"];
  let cursor = scene.startFrame;
  return weights.map((weight, index) => {
    const durationInFrames = index === weights.length - 1
      ? scene.endFrame - cursor : Math.max(12, Math.round(scene.durationInFrames * weight));
    const framing = framings[index];
    const movement = movements[index];
    const scale = framing === "wide" ? 1 : framing === "medium" ? 1.1 : 1.22;
    const shot: CinematicShot = {
      id: `${scene.id}-shot-${index + 1}`, startFrame: cursor, durationInFrames, framing, movement,
      scaleFrom: scene.camera?.scaleFrom ?? scale,
      scaleTo: scene.camera?.scaleTo ?? (movement === "push-in" ? scale + 0.08 : movement === "pull-out" ? scale - 0.06 : scale),
      xFrom: scene.camera?.xFrom ?? 0,
      xTo: scene.camera?.xTo ?? (movement === "pan-left" ? -48 : movement === "pan-right" ? 48 : 0),
      yFrom: scene.camera?.yFrom ?? 0, yTo: scene.camera?.yTo ?? -8,
    };
    cursor += durationInFrames;
    return shot;
  }).filter((shot) => shot.durationInFrames > 0);
};

export const getShotAtFrame = (shots: CinematicShot[], frame: number) =>
  shots.find((shot) => frame >= shot.startFrame && frame < shot.startFrame + shot.durationInFrames) ?? shots[shots.length - 1];
