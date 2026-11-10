import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Optional Gemini TTS voiceover. Uses the user's existing Gemini API key. */
export async function createVoiceover(story, apiKey, outputPath) {
  if (!apiKey) return { generated: false, reason: "Gemini API key is missing." };
  const transcript = story.scenes
    .map((scene) => scene.narration?.trim())
    .filter(Boolean)
    .join("\n\n");
  if (!transcript) return { generated: false, reason: "Story has no narration." };

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model: process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts",
      input: [{
        type: "user_input",
        content: [{
          type: "text",
          text: `Read this exact narration as an energetic, cinematic YouTube Shorts storyteller. Keep the delivery clear, expressive, brisk but natural, with dramatic emphasis on reveals. Do not add or remove words.\n\nNARRATION:\n${transcript}`,
          annotations: [{ type: "speech_metadata", style: "energetic cinematic narration, crisp diction, expressive pacing" }],
        }],
      }],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice: process.env.GEMINI_TTS_VOICE || "Puck" }] },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini TTS failed with HTTP ${response.status}.`);
  }
  const encoded = data?.output_audio?.data;
  if (!encoded) throw new Error("Gemini TTS returned no audio data.");
  const audio = Buffer.from(encoded, "base64");
  if (audio.subarray(0, 4).toString() !== "RIFF") {
    throw new Error("Gemini TTS did not return a WAV audio file.");
  }
  await writeFile(resolve(outputPath), audio);
  return { generated: true, bytes: audio.length, model: process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts" };
}
