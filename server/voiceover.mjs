import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Generate a single continuous cinematic narration WAV using Gemini TTS.
 * Uses the documented Gemini generateContent audio response, not the
 * experimental Interactions endpoint.
 */
export async function createVoiceover(story, apiKey, outputPath) {
  if (!apiKey) return { generated: false, reason: "Gemini API key is missing." };

  const scenes = Array.isArray(story?.scenes) ? story.scenes : [];
  const transcript = scenes
    .map((scene) => typeof scene?.narration === "string" ? scene.narration.trim() : "")
    .filter(Boolean)
    .join("\n\n");
  if (!transcript) return { generated: false, reason: "Story has no narration." };

  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";
  const voiceName = process.env.GEMINI_TTS_VOICE || "Charon";
  const style = process.env.GEMINI_TTS_STYLE ||
    "Deep cinematic storyteller. Low, warm, resonant voice; controlled natural pacing; intimate suspense; deliberate pauses before reveals; clear English diction. Do not sound like a trailer announcer. Read the supplied words exactly.";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: `${style}\n\nRead this narration verbatim:\n\n${transcript}` }],
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini TTS failed with HTTP ${response.status}.`;
    throw new Error(`${message} (model ${model})`);
  }

  const encoded = data?.candidates?.[0]?.content?.parts?.find(
    (part) => part?.inlineData?.data,
  )?.inlineData?.data;
  if (!encoded) {
    throw new Error("Gemini TTS returned no audio data. Check the selected TTS model and API access.");
  }

  const audio = Buffer.from(encoded, "base64");
  if (audio.subarray(0, 4).toString() !== "RIFF") {
    throw new Error("Gemini TTS did not return a WAV file.");
  }

  await writeFile(resolve(outputPath), audio);
  return { generated: true, bytes: audio.length, model, voiceName };
}
