import { useThree } from "@react-three/fiber";
import type React from "react";
import { useLayoutEffect } from "react";
import { PerspectiveCamera } from "three";

type CameraRig3DProps = {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov?: number;
};

/**
 * Deterministic Three.js camera controller driven purely by React props
 * computed from Remotion's useCurrentFrame() (no useFrame).
 */
export const CameraRig3D: React.FC<CameraRig3DProps> = ({
  position,
  target,
  fov = 42,
}) => {
  const camera = useThree((state) => state.camera);

  const [px, py, pz] = position;
  const [tx, ty, tz] = target;

  const applyCamera = () => {
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  };

  applyCamera();

  useLayoutEffect(() => {
    applyCamera();
  });

  return null;
};

