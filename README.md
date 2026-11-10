# STICKLAB

STICKLAB creates 45-second vertical illustrated mystery/horror Shorts. Remotion is the compositor: it applies restrained camera movement, scene cuts, captions, voiceover and sound.

## Locked production direction

- Visuals: cinematic illustrated 9:16 still frames, painterly graphic-novel realism
- Mood: atmospheric teal/cyan shadows, restrained red practical lights, volumetric fog and detailed environments
- Runtime: 45 seconds at 30 FPS, 1080x1920
- Editing: slow push-ins, subtle pans and clean hard cuts; no complex character rigs
- Narration: deep, warm, intimate cinematic storyteller
- Captions: large two-line white captions with yellow active-word emphasis
- Sound: original procedural transition and reveal effects

## Local setup

1. Copy `.env.example` to `.env`.
2. Add your Gemini API key to `GEMINI_API_KEY`.
3. Enable the paid/usage-metered generation stages you want to run:

```env
STICKLAB_IMAGE_GENERATION_ENABLED=true
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_TTS_ENABLED=true
GEMINI_TTS_MODEL=gemini-3.8-flash-tts
GEMINI_TTS_VOICE=Charon
```

Image generation and TTS can incur separate Gemini API charges. Keep either flag false to skip that stage. Generated scene images are saved under `public/scenes/`; narration is saved to `public/audio/voiceover.wav`.

4. Start Remotion Studio:

```bash
npm run dev
```

5. In a second terminal, start the local story server:

```bash
node server/index.mjs
```

6. Open `http://127.0.0.1:4179`, enter a story idea and create the Short. The generator writes the story to `src/story/generatedStory.ts`. Refresh or scrub Remotion Studio to preview.

## Production pipeline

1. Gemini writes a 45-second script and scene-by-scene visual prompts.
2. Gemini 3.1 Flash Image creates one 9:16 illustrated frame per scene.
3. Gemini 3.8 Flash TTS creates the deep cinematic narration WAV.
4. The caption track highlights words using narration-weighted timing.
5. Remotion applies subtle zooms, hard cuts, captions, narration and SFX, then renders MP4.

## Key files

- `server/index.mjs`: story generation and pipeline orchestration
- `server/illustrations.mjs`: per-scene illustrated frame generation
- `server/voiceover.mjs`: documented Gemini generateContent TTS integration
- `server/sound-design.mjs`: procedural sound effects
- `src/story/StoryPlayer.tsx`: image-first scene compositor with a legacy fallback
- `src/CaptionTrack.tsx`: high-contrast word-emphasis captions
- `src/story/StoryEngine.ts`: story validation and frame timing
- `src/story/generatedStory.ts`: current generated story

Never commit `.env` or API keys.
