import type React from "react";
import type { SceneData } from "../types/video";
import { Scene01TempatBaru } from "./Scene01TempatBaru";
import { Scene02ApaItuDejaVu } from "./Scene02ApaItuDejaVu";
import { Scene03SinyalOtak } from "./Scene03SinyalOtak";
import { Scene04KetidakcocokanSinyal } from "./Scene04KetidakcocokanSinyal";
import { Scene05PenutupKesimpulan } from "./Scene05PenutupKesimpulan";
import { Scene06IdentitasChannel } from "./Scene06IdentitasChannel";

export type SceneVisualComponent = React.FC<{ readonly scene: SceneData }>;

/**
 * Registry of custom visual components keyed by scene id (e.g. "scene-01").
 * New videos only need to update src/data/video.json and register scene visuals here.
 */
export const SCENE_VISUALS: Record<string, SceneVisualComponent> = {
  "scene-01": Scene01TempatBaru,
  "scene-02": Scene02ApaItuDejaVu,
  "scene-03": Scene03SinyalOtak,
  "scene-04": Scene04KetidakcocokanSinyal,
  "scene-05": Scene05PenutupKesimpulan,
  "scene-06": Scene06IdentitasChannel,
};
