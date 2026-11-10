const expressionValues = ["neutral", "happy", "sad", "shocked", "angry", "scared"];
const actionValues = ["idle", "walk", "run", "jump", "fall"];

export const storyResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    fps: { type: "INTEGER" },
    width: { type: "INTEGER" },
    height: { type: "INTEGER" },
    scenes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          durationSeconds: { type: "NUMBER" },
          background: { type: "STRING" },
          environment: { type: "STRING", enum: ["city", "street", "room", "office", "abstract"] },
          narration: { type: "STRING" },
          dialogue: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                characterId: { type: "STRING" },
                text: { type: "STRING" },
              },
              required: ["characterId", "text"],
            },
          },
          characters: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                x: { type: "NUMBER" },
                y: { type: "NUMBER" },
                scale: { type: "NUMBER" },
                action: { type: "STRING", enum: actionValues },
                expression: { type: "STRING", enum: expressionValues },
              },
              required: ["id", "x", "y", "action", "expression"],
            },
          },
          props: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                type: { type: "STRING", enum: ["phone", "table"] },
                id: { type: "STRING" },
                x: { type: "NUMBER" },
                y: { type: "NUMBER" },
                scale: { type: "NUMBER" },
              },
              required: ["type", "id", "x", "y"],
            },
          },
          camera: {
            type: "OBJECT",
            properties: {
              scaleFrom: { type: "NUMBER" },
              scaleTo: { type: "NUMBER" },
              xFrom: { type: "NUMBER" },
              xTo: { type: "NUMBER" },
              yFrom: { type: "NUMBER" },
              yTo: { type: "NUMBER" },
            },
          },
        },
        required: ["id", "durationSeconds", "narration", "characters"],
      },
    },
  },
  required: ["title", "fps", "width", "height", "scenes"],
};

export const allowedExpressions = expressionValues;
export const allowedActions = actionValues;
