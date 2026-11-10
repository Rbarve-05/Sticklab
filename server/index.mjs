import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { storyResponseSchema } from "./story-schema.mjs";
import { createSoundDesign } from "./sound-design.mjs";
import { createVoiceover } from "./voiceover.mjs";

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
You are the cinematic story director for STICKLAB, a code-rendered stylized 2.5D cartoon YouTube Shorts engine.
Create an original, highly engaging short story from this topic: "${topic}"

Target runtime: exactly ${duration} seconds at 30 FPS. Return 3 to 7 scenes whose durationSeconds add up to exactly ${duration}.
Audience: general English-speaking YouTube Shorts viewers. Write natural, punchy English.
Story structure: immediate hook in the first 2 seconds, clear escalation, visual payoff or twist, satisfying ending.
Create visually rich but code-buildable scenes: layered city/street/interior environments, foreground/midground/background separation, expressive recurring cartoon characters, and useful props. All visuals are drawn procedurally with SVG shapes; do not request imported images or video clips. Use environment values city, street, room, office or abstract. Plan a visual rhythm with wide establishing views, medium character action and close-up reactions; the renderer creates 2-4 shots per scene.
Use 1 to 3 recurring characters. Keep character IDs consistent across scenes.
Allowed actions: idle, walk, run, jump, fall.
Allowed expressions: neutral, happy, sad, shocked, angry, scared.
Coordinate system: 1080x1920. Put characters in x=100..980 and y=500..1250. Use scale 0.7..2.0.
Use punchy narration per scene (one or two short sentences, suitable for energetic voiceover and timed captions). Create an immediate hook, escalate every 5-8 seconds, and reserve the final scene for the twist/payoff.
Dialogue is optional and should be short enough for a speech bubble (maximum 5 words).
Set a distinct scene id for every scene. Set camera scale between 1 and 1.25. Use backgrounds as simple hex colors.
Do not add markdown, explanations, extra fields, sound files, URLs, or instructions. Return only the schema-conforming story JSON.
`;

async function generateStory(topic, duration) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing. Add it to the project .env file.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: promptFor(topic, duration) }] }],
      generationConfig: {
        // Ask for JSON output without sending a nested responseSchema. This
        // avoids Gemini structured-schema compilation failures; the server
        // validates the parsed story against the application rules below.
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[STICKLAB Gemini API response]", JSON.stringify(data, null, 2));
    const message = data?.error?.message || `Gemini request failed with HTTP ${response.status}.`;
    const details = data?.error?.details ? ` Details: ${JSON.stringify(data.error.details)}` : "";
    throw new Error(`${message} (HTTP ${response.status})${details}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!text) throw new Error("Gemini returned an empty response. Try again.");
  let story;
  try {
    story = JSON.parse(text);
  } catch {
    throw new Error("Gemini response was not valid JSON. Please try again.");
  }

  const errors = validateGeneratedStory(story, duration);
  if (errors.length) throw new Error(`Generated story failed validation: ${errors.join(" ")}`);

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
// Procedural SFX track: ${audioInfo.durationSeconds}s at ${audioInfo.sampleRate}Hz.
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
        message: "Story generated and saved. Remotion Studio should hot-reload.",
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
