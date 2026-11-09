# Stickman character module

## Usage

```tsx
import { Stickman } from "./Stickman";

<svg viewBox="0 0 1080 1920">
  <Stickman x={540} y={900} scale={2} action="walk" speed={1} />
</svg>
```

Supported actions: `idle`, `walk`, `run`, `jump`.

The component uses Remotion's current frame, so it renders deterministically in Studio and during export. Coordinates are SVG viewBox coordinates.
