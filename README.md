# STICKLAB

A programmatic minimalist 2D stickman storytelling Shorts generator.

## Project direction

STICKLAB turns a structured story into a vertical animated video:
1. Story brief and scene plan
2. Reusable stickman animation components
3. Narration and timed captions
4. Music and sound effects
5. 1080x1920 MP4 rendering

## Local development

This repository is being connected to an existing Remotion project. Keep your local project files safe and push them before replacing or reorganizing existing files.

## First milestone

Build a reusable SVG stickman with deterministic idle and walk cycles, then render a short preview composition.


## Gemini AI Story Generator

The local generator uses Gemini structured JSON output and writes a validated story directly into `src/story/generatedStory.ts`.

1. Create a Gemini API key in Google AI Studio.
2. Copy `.env.example` to `.env`.
3. Add your key to `GEMINI_API_KEY` in `.env`. Never commit the real `.env` file.
4. Start the local story server in a second terminal:

```bash
node server/index.mjs
```

5. Open `http://127.0.0.1:4179`, enter a topic, and generate a 30- or 45-second story.
6. The generated story is saved to `src/story/generatedStory.ts`; Remotion Studio should hot-reload the composition.

The server binds only to localhost and uses Node's built-in HTTP and fetch APIs, so it adds no runtime package dependency. Default model: `gemini-3.8-flash`. Override with `GEMINI_MODEL` in `.env`.

### Story generator files
- `server/index.mjs`: local Gemini API server
- `server/story-schema.mjs`: constrained response schema
- `public/story-generator.html`: local prompt interface
- `src/story/generatedStory.ts`: active generated story, initially falling back to the sample
