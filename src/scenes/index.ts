import type React from "react";
import type { SceneData } from "../types/video";

export type SceneVisualComponent = React.FC<{ readonly scene: SceneData }>;

/**
 * Registry of custom visual components keyed by scene id (e.g. "scene-01").
 * New videos only need to update src/data/video.json and register scene visuals here.
 */
export const SCENE_VISUALS: Record<string, SceneVisualComponent> = {};

