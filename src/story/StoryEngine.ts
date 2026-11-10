import type {
  CompiledStory,
  CompiledStoryScene,
  StoryDocument,
  StoryValidationResult,
} from "./types";

/** Validate either illustrated still scenes or legacy character scenes safely. */
export const validateStory = (story: StoryDocument): StoryValidationResult => {
  const errors: string[] = [];

  if (typeof story?.title !== "string" || !story.title.trim()) errors.push("Story title is required.");
  if (!Number.isInteger(story?.fps) || story.fps <= 0) errors.push("FPS must be a positive integer.");
  if (!Number.isInteger(story?.width) || story.width <= 0) errors.push("Width must be a positive integer.");
  if (!Number.isInteger(story?.height) || story.height <= 0) errors.push("Height must be a positive integer.");

  const scenes = Array.isArray(story?.scenes) ? story.scenes : [];
  if (scenes.length === 0) errors.push("At least one scene is required.");

  const sceneIds = new Set<string>();
  scenes.forEach((scene, sceneIndex) => {
    const prefix = `Scene ${sceneIndex + 1}`;
    if (typeof scene.id !== "string" || !scene.id.trim()) errors.push(`${prefix}: id is required.`);
    if (typeof scene.id === "string" && sceneIds.has(scene.id)) errors.push(`${prefix}: duplicate scene id "${scene.id}".`);
    if (typeof scene.id === "string") sceneIds.add(scene.id);

    if (!Number.isFinite(scene.durationSeconds) || scene.durationSeconds <= 0) {
      errors.push(`${prefix}: durationSeconds must be greater than zero.`);
    }

    const characters = Array.isArray(scene.characters) ? scene.characters : [];
    if (characters.length === 0 && !scene.imagePath) {
      errors.push(`${prefix}: add an illustrated image or at least one character.`);
    }

    const characterIds = new Set<string>();
    characters.forEach((character) => {
      if (typeof character.id !== "string" || !character.id.trim()) errors.push(`${prefix}: character id is required.`);
      if (characterIds.has(character.id)) errors.push(`${prefix}: duplicate character id "${character.id}".`);
      characterIds.add(character.id);
      if (![character.x, character.y].every(Number.isFinite)) errors.push(`${prefix}: character "${character.id}" has invalid coordinates.`);
      if (character.scale !== undefined && (!Number.isFinite(character.scale) || character.scale <= 0)) {
        errors.push(`${prefix}: character "${character.id}" has invalid scale.`);
      }
    });

    (Array.isArray(scene.dialogue) ? scene.dialogue : []).forEach((line) => {
      if (!characterIds.has(line.characterId)) errors.push(`${prefix}: dialogue references unknown character "${line.characterId}".`);
      if (typeof line.text !== "string" || !line.text.trim()) errors.push(`${prefix}: dialogue text cannot be empty.`);
    });
  });

  return { valid: errors.length === 0, errors };
};

/** Compile seconds-based scenes into deterministic Remotion frame ranges. */
export const compileStory = (story: StoryDocument): CompiledStory => {
  const validation = validateStory(story);
  if (!validation.valid) throw new Error(`Invalid story:\n- ${validation.errors.join("\n- ")}`);

  let cursor = 0;
  const scenes: CompiledStoryScene[] = story.scenes.map((scene) => {
    const durationInFrames = Math.max(1, Math.round(scene.durationSeconds * story.fps));
    const compiledScene: CompiledStoryScene = {
      ...scene,
      startFrame: cursor,
      durationInFrames,
      endFrame: cursor + durationInFrames,
    };
    cursor += durationInFrames;
    return compiledScene;
  });

  return {
    title: story.title,
    fps: story.fps,
    width: story.width,
    height: story.height,
    durationInFrames: cursor,
    scenes,
  };
};
