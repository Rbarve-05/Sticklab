import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Generate one portrait illustrated still per story scene.
 * Uses Gemini 3.1 Flash Image's documented generateContent REST API.
 */
export async function createIllustratedScenes(story, apiKey, publicDir) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is required for scene illustration.");
  const scenes = Array.isArray(story?.scenes) ? story.scenes : [];
  if (!scenes.length) throw new Error("Cannot illustrate a story without scenes.");

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
  const outputDir = join(publicDir, "scenes");
  await mkdir(outputDir, { recursive: true });

  const generated = [];
  let continuityReference = null;
  for (const [index, scene] of scenes.entries()) {
    const fileName = `scene-${String(index + 1).padStart(2, "0")}.png`;
    const prompt = [
      "Create a single premium cinematic illustrated frame for a vertical mystery/horror short.",
      "Visual language: highly detailed digital illustration, painterly graphic-novel realism, atmospheric teal/cyan fog, restrained crimson practical lights, deep shadows, volumetric lighting, realistic wet-surface reflections, strong cinematic composition.",
      "Portrait 9:16 composition, full-bleed artwork, no borders, no panels, no captions, no subtitles, no logos, no watermarks, no UI.",
      "Maintain the same protagonist identity, hairstyle, clothing and silhouette as the previous scene reference, while changing the location details and camera composition to match this beat.",
      "Frame description: " + (scene.visualPrompt || scene.narration || story.title),
      "Narrative context: " + (scene.narration || ""),
      "Avoid stick figures, flat vector art, childish cartoons, generic stock-photo appearance, and text rendered inside the image.",
    ].join("\n");

    const parts = [{ text: prompt }];
    if (continuityReference) {
      parts.push({ inlineData: { mimeType: "image/png", data: continuityReference } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              aspectRatio: "9:16",
              imageSize: "1K",
            },
          },
        }),
        signal: AbortSignal.timeout(180_000),
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `Image generation failed with HTTP ${response.status}.`;
      throw new Error(`Scene ${index + 1}: ${message}`);
    }

    const imagePart = data?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error(`Scene ${index + 1}: image model returned no image data.`);
    }

    continuityReference = imagePart.inlineData.data;
    await writeFile(join(outputDir, fileName), Buffer.from(continuityReference, "base64"));
    scene.imagePath = `scenes/${fileName}`;
    generated.push(scene.imagePath);
    console.log(`[STICKLAB] Illustrated scene ${index + 1}/${scenes.length}: ${fileName}`);
  }

  return { generated: generated.length, paths: generated, model };
}
