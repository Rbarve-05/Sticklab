import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { storyResponseSchema } from "./story-schema.mjs";
import { createSoundDesign } from "./sound-design.mjs";
import { createVoiceover } from "./voiceover.mjs";
import { createIllustratedScenes } from "./illustrations.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.STICKLAB_PORT || 4179);

function loadEnvFile() {
  // Small .env reader so this server needs no extra runtime dependencies.
  return readFile(resolve(ROOT, ".env"), "utf8")
    .then((contents) => {
      for (const line of contents.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || process.env[match[1]]) continue;
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
      }
    })
    .catch(() => {});
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 20_000) throw new Error("Request is too large.");
  }
  return JSON.parse(body || "{}");
}

function validateGeneratedStory(story, targetDuration) {
  const errors = [];
  if (!story || typeof story !== "object") return ["Gemini returned an invalid story object."];
  if (story.fps !== 30 || story.width !== 1080 || story.height !== 1920) {
    errors.push("Story dimensions must be 1080x1920 at 30 FPS.");
  }
  if (!Array.isArray(story.scenes) || story.scenes.length < 3 || story.scenes.length > 7) {
    errors.push("Story must contain between 3 and 7 scenes.");
    return errors;
  }

  const sceneIds = new Set();
  let total = 0;
  for (const [index, scene] of story.scenes.entries()) {
    const label = `Scene ${index + 1}`;
    if (!scene.id || sceneIds.has(scene.id)) errors.push(`${label}: missing or duplicate scene id.`);
    sceneIds.add(scene.id);
    if (!Number.isFinite(scene.durationSeconds) || scene.durationSeconds <= 0) {
      errors.push(`${label}: invalid duration.`);
    } else total += scene.durationSeconds;
    if (!Array.isArray(scene.characters) || scene.characters.length < 1 || scene.characters.length > 3) {
      errors.push(`${label}: include 1 to 3 characters.`);
      continue;
    }
    const ids = new Set();
    for (const character of scene.characters) {
      if (!character.id || ids.has(character.id)) errors.push(`${label}: missing or duplicate character id.`);
      ids.add(character.id);
      if (!Number.isFinite(character.x) || !Number.isFinite(character.y) ||
          character.x < 100 || character.x > 980 || character.y < 500 || character.y > 1250) {
        errors.push(`${label}: character coordinates are outside the safe scene area.`);
      }
      if (character.scale !== undefined && (character.scale < 0.5 || character.scale > 2.5)) {
        errors.push(`${label}: character scale is outside the supported range.`);
      }
      if (!storyResponseSchema.properties.scenes.items.properties.characters.items.properties.action.enum.includes(character.action)) {
        errors.push(`${label}: unsupported character action.`);
      }
      if (!storyResponseSchema.properties.scenes.items.properties.characters.items.properties.expression.enum.includes(character.expression)) {
        errors.push(`${label}: unsupported character expression.`);
      }
    }
    for (const line of scene.dialogue || []) {
      if (!ids.has(line.characterId)) errors.push(`${label}: dialogue refers to an unknown character.`);
    }
  }

  if (Math.abs(total - targetDuration) > 0.25) {
    errors.push(`Scene durations total ${total.toFixed(1)} seconds, not the requested ${targetDuration} seconds.`);
  }
  return errors;
}

const promptFor = (topic, duration) => `
You are the lead writer and visual director for STICKLAB, a cinematic illustrated mystery/horror YouTube Shorts studio.
Create an original, highly engaging short story from this topic: "${topic}"

Target runtime: exactly ${duration} seconds at 30 FPS. Return 3 to 7 scenes whose durationSeconds add up to exactly ${duration}.
Audience: general English-speaking YouTube Shorts viewers. Write natural, punchy English.
Story structure: immediate hook in the first 2 seconds, clear escalation, visual payoff or twist, satisfying ending.
Create 5 to 7 cinematic illustrated scenes. Each scene must include a specific visualPrompt describing one premium portrait 9:16 illustrated frame: camera angle, environment, subject placement, lighting, atmosphere, foreground/midground/background, and the exact story beat. Visual direction: painterly graphic-novel realism, atmospheric teal/cyan shadows, restrained red practical lights, volumetric fog, detailed environments, wet reflections where appropriate. Keep recurring characters visually consistent by repeating their defining appearance in each visualPrompt. Do not ask the renderer to draw stick figures or use flat vector art. The renderer will apply only subtle slow zooms and clean hard cuts between still illustrations.
Use 1 to 3 recurring characters. Keep character IDs consistent across scenes.
Allowed actions: idle, walk, run, jump, fall.
Allowed expressions: neutral, happy, sad, shocked, angry, scared.
Coordinate system: 1080x1920. Put characters in x=100..980 and y=500..1250. Use scale 0.7..2.0.
Write a complete 45-second narration script of approximately 90-100 spoken words across the scenes. Narration must sound natural when spoken by a deep, intimate cinematic storyteller: concise, vivid, suspenseful, with intentional short sentences and pauses before reveals. The first line must hook immediately. Every scene must reveal new information or raise a sharper question. Save the strongest reveal for the final scene. Avoid filler, generic phrases, and over-explaining.
Dialogue is optional and should be short enough for a speech bubble (maximum 5 words).
Set a distinct scene id for every scene. Include visualPrompt for every scene. The total runtime must be exactly the requested duration.
Do not add markdown, explanations, extra fields, sound files, URLs, or instructions. Return only the schema-conforming story JSON.
`;

async function generateStory(topic, duration) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing. Add it to the project .env file.");
  const modelsToTry = [...new Set([MODEL, "gemini-3.8-flash", "gemini-3.5-flash"])];
  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: promptFor(topic, duration) }] }],
    generationConfig: {
      // JSON mode; application validation runs after parsing.
      responseMimeType: "application/json",
      temperature: 0.9,
    },
  });

  let response;
  let activeModel = MODEL;
  for (const model of modelsToTry) {
    activeModel = model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: requestBody,
      signal: AbortSignal.timeout(60_000),
    });
    if (response.ok) break;

    // A 503/429 is a capacity or rate-limit response, not a bad story.
    // Try another supported Flash model automatically before giving up.
    if (![429, 503].includes(response.status)) break;
    console.warn(`Gemini model ${model} returned HTTP ${response.status}; trying the next fallback if available.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[STICKLAB Gemini API response from ${activeModel}]`, JSON.stringify(data, null, 2));
    const message = data?.error?.message || `Gemini request failed with HTTP ${response.status}.`;
    const details = data?.error?.details ? ` Details: ${JSON.stringify(data.error.details)}` : "";
    throw new Error(`${message} (HTTP ${response.status}, model ${activeModel})${details}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty response. Try again.");
  let story;
  try {
    story = JSON.parse(text);
  } catch {
    throw new Error("Gemini response was not valid JSON. Please try again.");
  }

  // Gemini JSON mode does not guarantee every metadata field. Normalize
  // predictable renderer metadata before strict validation and saving.
  story.title = typeof story.title === "string" && story.title.trim()
    ? story.title.trim()
    : "The Countdown";
  story.fps = Number.isFinite(story.fps) ? story.fps : 30;
  story.width = Number.isFinite(story.width) ? story.width : 1080;
  story.height = Number.isFinite(story.height) ? story.height : 1920;
  // Normalize missing or malformed scene containers as well as short arrays.
  if (!Array.isArray(story.scenes)) story.scenes = [];
  {
    // The renderer requires 3-7 scenes. If Gemini returns too few, split
    // existing beats into distinct timed shots; if too many, cap at 7.
    if (story.scenes.length > 7) story.scenes = story.scenes.slice(0, 7);
    while (story.scenes.length > 0 && story.scenes.length < 3) {
      const source = story.scenes[story.scenes.length - 1];
      story.scenes.push({
        ...source,
        id: `scene-${story.scenes.length + 1}`,
        narration: source.narration || "The moment changes everything.",
        characters: Array.isArray(source.characters) ? source.characters.map((character) => ({ ...character })) : [],
        props: Array.isArray(source.props) ? source.props.map((prop) => ({ ...prop })) : [],
        dialogue: Array.isArray(source.dialogue) ? source.dialogue.map((line) => ({ ...line })) : [],
      });
    }
    if (story.scenes.length === 0) {
      story.scenes = [
        { id: "scene-1", narration: `A strange event begins: ${topic}.`, characters: [] },
        { id: "scene-2", narration: "The situation suddenly becomes more dangerous.", characters: [] },
        { id: "scene-3", narration: "One final choice changes everything.", characters: [] },
      ];
    }

    story.scenes = story.scenes.map((scene, sceneIndex) => {
      const normalized = { ...scene, id: scene.id || `scene-${sceneIndex + 1}` };
      normalized.narration = typeof normalized.narration === "string" && normalized.narration.trim()
        ? normalized.narration.trim()
        : "Something is wrong here. And nobody knows why.";
      normalized.visualPrompt = typeof normalized.visualPrompt === "string" && normalized.visualPrompt.trim()
        ? normalized.visualPrompt.trim()
        : `Cinematic illustrated frame for ${story.title}: ${normalized.narration}. Detailed environment, strong composition, dramatic teal shadows and practical light.`;
      const suppliedCharacters = Array.isArray(normalized.characters) ? normalized.characters : [];
      normalized.characters = suppliedCharacters.slice(0, 3).map((character, characterIndex) => ({
        ...character,
        id: character.id || `character-${characterIndex + 1}`,
        x: Number.isFinite(character.x) ? character.x : 540,
        y: Number.isFinite(character.y) ? character.y : 1050,
        scale: Number.isFinite(character.scale) ? character.scale : 1,
        action: character.action || "idle",
        expression: character.expression || "neutral",
      }));
      // Keep the renderer contract valid even when Gemini omits characters.
      if (normalized.characters.length === 0) {
        normalized.characters = [{
          id: "protagonist",
          x: 540,
          y: 1050,
          scale: 1,
          action: "idle",
          expression: "neutral",
        }];
      }
      const validCharacterIds = new Set(normalized.characters.map((character) => character.id));
      normalized.dialogue = Array.isArray(normalized.dialogue)
        ? normalized.dialogue.filter((line) => validCharacterIds.has(line.characterId))
        : [];
      return normalized;
    });

    // Preserve the requested runtime exactly. Apply small model rounding drift
    // to the final scene instead of rejecting an otherwise usable story.
    // Align scene cuts and caption windows to narration length so the
    // continuous voiceover and per-scene captions stay close together.
    const rawDurations = story.scenes.map((scene) =>
      Math.max(1, (scene.narration || "").trim().split(/\s+/).filter(Boolean).length),
    );
    const rawTotal = rawDurations.reduce((sum, value) => sum + value, 0);
    let assignedFrames = 0;
    story.scenes = story.scenes.map((scene, index) => {
      const durationSeconds = index === story.scenes.length - 1
        ? duration / 1 - assignedFrames
        : Math.round((rawDurations[index] / rawTotal) * duration * 10) / 10;
      assignedFrames += durationSeconds;
      return { ...scene, durationSeconds };
    });
  }

  const errors = validateGeneratedStory(story, duration);
  if (errors.length) throw new Error(`Generated story failed validation: ${errors.join(" ")}`);

  let illustrationInfo = { generated: 0, paths: [] };
  if (process.env.STICKLAB_IMAGE_GENERATION_ENABLED === "true") {
    illustrationInfo = await createIllustratedScenes(story, apiKey, resolve(ROOT, "public"));
  }

  const audioInfo = await createSoundDesign(story, resolve(ROOT, "public/audio/story-sfx.wav"));
  let voiceoverInfo = { generated: false };
  if (process.env.GEMINI_TTS_ENABLED === "true") {
    try {
      voiceoverInfo = await createVoiceover(story, apiKey, resolve(ROOT, "public/audio/voiceover.wav"));
    } catch (error) {
      console.warn("Voiceover generation skipped:", error instanceof Error ? error.message : error);
    }
  }
  const output = `import type { StoryDocument } from "./types";

export const generatedStory: StoryDocument = ${JSON.stringify(story, null, 2)};
export const hasGeneratedSfx = true;
export const hasGeneratedVoiceover = ${voiceoverInfo.generated};
// Procedural SFX track: ${audioInfo.durationSeconds}s at ${audioInfo.sampleRate}Hz.\n// Illustrated scenes generated: ${illustrationInfo.generated}.
`;
  await writeFile(resolve(ROOT, "src/story/generatedStory.ts"), output, "utf8");
  return story;
}

await loadEnvFile();
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${PORT}`);

  if (request.method === "GET" && url.pathname === "/") {
    const html = await readFile(resolve(ROOT, "public/story-generator.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, configured: Boolean(process.env.GEMINI_API_KEY), model: MODEL });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/generate-story") {
    try {
      const body = await readJson(request);
      const topic = typeof body.topic === "string" ? body.topic.trim() : "";
      const duration = Number(body.durationSeconds);
      if (topic.length < 8 || topic.length > 500) {
        sendJson(response, 400, { error: "Topic must be between 8 and 500 characters." });
        return;
      }
      if (![30, 45].includes(duration)) {
        sendJson(response, 400, { error: "Choose a 30 or 45 second story." });
        return;
      }
      const story = await generateStory(topic, duration);
      sendJson(response, 200, {
        ok: true,
        message: "Story generated and saved. " + (story.scenes.some((scene) => scene.imagePath) ? "Illustrated frames are ready. " : "Enable STICKLAB_IMAGE_GENERATION_ENABLED for illustrated frames. ") + (voiceoverInfo.generated ? "Deep cinematic voiceover is ready. " : "Enable GEMINI_TTS_ENABLED for deep cinematic voiceover. ") + "Remotion Studio should hot-reload.",
        story,
      });
    } catch (error) {
      console.error("[STICKLAB story generation error]", error);
      sendJson(response, 500, { error: error instanceof Error ? error.message : "Story generation failed." });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found." });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`STICKLAB Story Generator: http://127.0.0.1:${PORT}`);
  console.log(`Gemini model: ${MODEL}`);
});
