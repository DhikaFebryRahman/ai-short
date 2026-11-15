import type React from "react";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { FONT_FAMILIES } from "../../fonts";
import { THEME_COLORS } from "../../theme";

export type Text3DPlaqueProps = {
  readonly text: string;
  readonly subtext?: string;
  readonly accentColor?: string;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number;
  readonly width?: number;
  readonly height?: number;
  readonly depth?: number;
  readonly opacity?: number;
  readonly showBacking?: boolean;
};

/**
 * High-contrast 3D extruded typography slab rendered with crisp CanvasTexture + metallic casing
 * and luminous rim bars for true 3D orbital parallax without external font JSON fetches.
 */
export const Text3DPlaque: React.FC<Text3DPlaqueProps> = ({
  text,
  subtext,
  accentColor = THEME_COLORS.accents.amber,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 2.6,
  height = 0.85,
  depth = 0.14,
  opacity = 1,
  showBacking = true,
}) => {
  const texture = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle dark gradient backdrop inside glass face
    if (showBacking) {
      const grad = ctx.createLinearGradient(0, 0, 1024, 384);
      grad.addColorStop(0, "rgba(15, 23, 46, 0.94)");
      grad.addColorStop(0.5, "rgba(21, 34, 68, 0.92)");
      grad.addColorStop(1, "rgba(13, 18, 36, 0.96)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 384);
    }

    // Main title (dynamically sized to guarantee generous horizontal margins)
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const mainY = subtext ? 152 : 192;
    let mainFontSize = text.length > 14 ? 82 : 108;
    ctx.font = `800 ${mainFontSize}px ${FONT_FAMILIES.sans}, sans-serif`;
    const maxTextWidth = 860;
    while (mainFontSize > 42 && ctx.measureText(text).width > maxTextWidth) {
      mainFontSize -= 4;
      ctx.font = `800 ${mainFontSize}px ${FONT_FAMILIES.sans}, sans-serif`;
    }

    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = THEME_COLORS.accents.white;
    ctx.fillText(text, 512, mainY);

    // Subtle crisp metallic highlight pass
    ctx.shadowBlur = 0;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.strokeText(text, 512, mainY);

    if (subtext) {
      ctx.shadowColor = "rgba(60, 225, 254, 0.65)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = accentColor;
      ctx.font = `700 34px ${FONT_FAMILIES.sans}, sans-serif`;
      ctx.fillText(subtext, 512, 266);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [text, subtext, accentColor, showBacking]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (opacity <= 0.01) {
    return null;
  }

  return (
    <group
      position={[position[0], position[1], position[2]]}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
    >
      {/* Metallic dark casing giving true 3D extruded thickness on orbit */}
      {showBacking ? (
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color="#172447"
            metalness={0.55}
            roughness={0.28}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      ) : null}

      {/* Top & bottom glowing neon edge bars */}
      {showBacking ? (
        <>
          <mesh position={[0, height * 0.5 + 0.015, depth * 0.08]}>
            <boxGeometry args={[width * 0.96, 0.03, depth * 0.9]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.85}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
          <mesh position={[0, -height * 0.5 - 0.015, depth * 0.08]}>
            <boxGeometry args={[width * 0.96, 0.03, depth * 0.9]} />
            <meshStandardMaterial
              color={THEME_COLORS.accents.cyan}
              emissive={THEME_COLORS.accents.cyan}
              emissiveIntensity={0.65}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
        </>
      ) : null}

      {/* Crisp front & back text layers */}
      {texture ? (
        <>
          <mesh position={[0, 0, depth * 0.5 + 0.004]}>
            <planeGeometry args={[width * 0.95, height * 0.92]} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={opacity}
              depthWrite={!showBacking ? false : true}
            />
          </mesh>
          {showBacking ? (
            <mesh
              position={[0, 0, -depth * 0.5 - 0.004]}
              rotation={[0, Math.PI, 0]}
            >
              <planeGeometry args={[width * 0.95, height * 0.92]} />
              <meshBasicMaterial
                map={texture}
                transparent
                opacity={opacity * 0.85}
              />
            </mesh>
          ) : null}
        </>
      ) : null}
    </group>
  );
};
