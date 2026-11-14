import { ThreeCanvas } from "@remotion/three";
import type React from "react";
import { LAYOUT, SAFE_ZONE } from "../theme";

type Scene3DStageProps = {
  readonly width?: number;
  readonly height?: number;
  readonly cameraPosition?: readonly [number, number, number];
  readonly fov?: number;
  readonly children: React.ReactNode;
};

/**
 * Reusable 3D stage powered by @remotion/three with transparent background
 * and balanced studio lighting, sized to fit inside the scene visual safe zone.
 */
export const Scene3DStage: React.FC<Scene3DStageProps> = ({
  width = SAFE_ZONE.contentWidth,
  height = LAYOUT.scene.visualHeight,
  cameraPosition = [0, 0, 5],
  fov = 40,
  children,
}) => {
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{
        position: [cameraPosition[0], cameraPosition[1], cameraPosition[2]],
        fov,
      }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, 3]} intensity={0.35} color="#3CE1FE" />
      {children}
    </ThreeCanvas>
  );
};

