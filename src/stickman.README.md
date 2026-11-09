# Stickman character module

Reusable expressive 2D character for Remotion scenes.

## Usage

```tsx
import { Stickman } from "./Stickman";

<svg viewBox="0 0 1080 1920">
  <Stickman
    x={540}
    y={900}
    scale={2}
    action="walk"
    expression="happy"
    accent="#FFD84D"
  />
</svg>
```

## Actions

- `idle`
- `walk`
- `run`
- `jump`
- `fall`

## Expressions

- `neutral`
- `happy`
- `sad`
- `shocked`
- `angry`
- `scared`

The component uses Remotion's current frame, so the animation is deterministic in Studio and during export. Coordinates are SVG viewBox coordinates.
