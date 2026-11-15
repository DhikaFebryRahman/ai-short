import type React from "react";
import { THEME_COLORS } from "../../theme";

export type Character3DProps = {
  readonly position?: readonly [number, number, number];
  readonly rotationY?: number;
  readonly walkPhase?: number;
  readonly walkIntensity?: number;
  readonly headTurnY?: number;
  readonly headTiltX?: number;
  readonly surpriseAmount?: number;
  readonly blinkAmount?: number;
  readonly echoOpacity?: number;
  readonly echoOffset?: readonly [number, number, number];
};

const SKIN_COLOR = "#EAC0A2";
const HAIR_COLOR = "#13192B";
const JACKET_COLOR = "#2B4075";
const JACKET_INNER = "#192544";
const TROUSERS_COLOR = "#1A2540";
const SHOE_COLOR = "#0E1424";

type FigureBodyProps = {
  readonly walkPhase: number;
  readonly walkIntensity: number;
  readonly headTurnY: number;
  readonly headTiltX: number;
  readonly surpriseAmount: number;
  readonly blinkAmount: number;
  readonly ghostMode?: boolean;
  readonly ghostOpacity?: number;
};

const FigureBody: React.FC<FigureBodyProps> = ({
  walkPhase,
  walkIntensity,
  headTurnY,
  headTiltX,
  surpriseAmount,
  blinkAmount,
  ghostMode = false,
  ghostOpacity = 0.25,
}) => {
  const stride = Math.sin(walkPhase) * 0.42 * walkIntensity;
  const kneeL = Math.max(0, -Math.sin(walkPhase) * 0.34) * walkIntensity;
  const kneeR = Math.max(0, Math.sin(walkPhase) * 0.34) * walkIntensity;
  const bodyBob = Math.abs(Math.sin(walkPhase)) * 0.03 * walkIntensity;
  const torsoLean = 0.055 * walkIntensity - 0.025 * surpriseAmount;

  const armSwingL = -stride * 0.6;
  const armSwingR =
    stride * 0.6 * (1 - surpriseAmount * 0.85) + surpriseAmount * 0.45;
  const forearmLiftR = surpriseAmount * 0.62 + 0.14 * walkIntensity;
  const forearmLiftL = 0.14 * walkIntensity;

  const browLift = surpriseAmount * 0.02;
  const browTilt = surpriseAmount * 0.14;
  const eyeScaleY = Math.max(
    0.08,
    (1 + surpriseAmount * 0.24) * (1 - blinkAmount * 0.92),
  );

  const ghostMat = {
    color: THEME_COLORS.accents.cyan,
    emissive: THEME_COLORS.accents.cyan,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: ghostOpacity * 0.28,
    roughness: 0.25,
    depthWrite: false,
  } as const;

  const makeMat = (color: string, roughness = 0.55, metalness = 0.08) =>
    ghostMode
      ? ghostMat
      : ({
          color,
          roughness,
          metalness,
        } as const);

  return (
    <group position={[0, bodyBob, 0]}>
      {/* Sculpted Pelvis */}
      <mesh position={[0, 0.84, 0]} scale={[1.15, 0.6, 0.72]}>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshStandardMaterial {...makeMat(TROUSERS_COLOR, 0.7)} />
      </mesh>

      {/* Left Leg */}
      <group position={[-0.088, 0.8, 0]} rotation={[stride, 0, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.062, 0.26, 8, 14]} />
          <meshStandardMaterial {...makeMat(TROUSERS_COLOR, 0.72)} />
        </mesh>
        <group position={[0, -0.39, 0]} rotation={[kneeL, 0, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.052, 0.25, 8, 14]} />
            <meshStandardMaterial {...makeMat(TROUSERS_COLOR, 0.72)} />
          </mesh>
          <mesh position={[0, -0.36, 0.042]} scale={[1, 0.72, 1.85]}>
            <sphereGeometry args={[0.058, 12, 12]} />
            <meshStandardMaterial {...makeMat(SHOE_COLOR, 0.5)} />
          </mesh>
          {!ghostMode ? (
            <mesh position={[0, -0.395, 0.042]}>
              <cylinderGeometry args={[0.055, 0.058, 0.015, 14]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                emissive={THEME_COLORS.accents.amber}
                emissiveIntensity={0.3}
                roughness={0.35}
              />
            </mesh>
          ) : null}
        </group>
      </group>

      {/* Right Leg */}
      <group position={[0.088, 0.8, 0]} rotation={[-stride, 0, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.062, 0.26, 8, 14]} />
          <meshStandardMaterial {...makeMat(TROUSERS_COLOR, 0.72)} />
        </mesh>
        <group position={[0, -0.39, 0]} rotation={[kneeR, 0, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.052, 0.25, 8, 14]} />
            <meshStandardMaterial {...makeMat(TROUSERS_COLOR, 0.72)} />
          </mesh>
          <mesh position={[0, -0.36, 0.042]} scale={[1, 0.72, 1.85]}>
            <sphereGeometry args={[0.058, 12, 12]} />
            <meshStandardMaterial {...makeMat(SHOE_COLOR, 0.5)} />
          </mesh>
          {!ghostMode ? (
            <mesh position={[0, -0.395, 0.042]}>
              <cylinderGeometry args={[0.055, 0.058, 0.015, 14]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                emissive={THEME_COLORS.accents.amber}
                emissiveIntensity={0.3}
                roughness={0.35}
              />
            </mesh>
          ) : null}
        </group>
      </group>

      {/* Upper Torso + Arms + Head */}
      <group position={[0, 0.86, 0]} rotation={[torsoLean, 0, 0]}>
        {/* Sculpted rounded jacket torso (tapered chest to waist) */}
        <mesh position={[0, 0.23, 0]} scale={[1.2, 1, 0.72]}>
          <cylinderGeometry args={[0.155, 0.132, 0.4, 20]} />
          <meshStandardMaterial {...makeMat(JACKET_COLOR, 0.56)} />
        </mesh>

        {/* Smooth sloped upper shoulder dome */}
        <mesh position={[0, 0.405, 0]} scale={[1.24, 0.62, 0.75]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial {...makeMat(JACKET_COLOR, 0.56)} />
        </mesh>

        {/* Inner dark shirt & sleek turtleneck trim */}
        {!ghostMode ? (
          <>
            <mesh position={[0, 0.29, 0.072]} scale={[0.88, 1, 0.62]}>
              <cylinderGeometry args={[0.072, 0.045, 0.33, 14]} />
              <meshStandardMaterial color={JACKET_INNER} roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.485, 0.008]} rotation={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.054, 0.064, 0.055, 16]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                roughness={0.45}
              />
            </mesh>
          </>
        ) : null}

        {/* Left Arm */}
        <group position={[-0.205, 0.41, 0]} rotation={[armSwingL, 0, 0.07]}>
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[0.046, 0.18, 8, 12]} />
            <meshStandardMaterial {...makeMat(JACKET_COLOR, 0.58)} />
          </mesh>
          <group position={[0, -0.25, 0]} rotation={[-forearmLiftL, 0, 0]}>
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.039, 0.16, 8, 12]} />
              <meshStandardMaterial {...makeMat(JACKET_COLOR, 0.58)} />
            </mesh>
            <mesh position={[0, -0.24, 0.01]}>
              <sphereGeometry args={[0.042, 12, 12]} />
              <meshStandardMaterial {...makeMat(SKIN_COLOR, 0.62)} />
            </mesh>
          </group>
        </group>

        {/* Right Arm (lifts gently into puzzled gesture on surprise) */}
        <group
          position={[0.205, 0.41, 0]}
          rotation={[-armSwingR, 0, -0.07 - surpriseAmount * 0.06]}
        >
          <mesh position={[0, -0.13, 0]}>
            <capsuleGeometry args={[0.046, 0.18, 8, 12]} />
            <meshStandardMaterial {...makeMat(JACKET_COLOR, 0.58)} />
          </mesh>
          <group
            position={[0, -0.25, 0]}
            rotation={[-forearmLiftR, surpriseAmount * 0.28, 0]}
          >
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.039, 0.16, 8, 12]} />
              <meshStandardMaterial {...makeMat(JACKET_COLOR, 0.58)} />
            </mesh>
            <mesh position={[0, -0.24, 0.01]}>
              <sphereGeometry args={[0.042, 12, 12]} />
              <meshStandardMaterial {...makeMat(SKIN_COLOR, 0.62)} />
            </mesh>
          </group>
        </group>

        {/* Neck & Sculpted Head */}
        <group
          position={[0, 0.49, 0]}
          rotation={[headTiltX, headTurnY, surpriseAmount * 0.04]}
        >
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.048, 0.056, 0.09, 14]} />
            <meshStandardMaterial {...makeMat(SKIN_COLOR, 0.62)} />
          </mesh>

          {/* Head cranium */}
          <mesh position={[0, 0.18, 0.008]} scale={[0.92, 1.05, 0.96]}>
            <sphereGeometry args={[0.142, 22, 22]} />
            <meshStandardMaterial {...makeMat(SKIN_COLOR, 0.58)} />
          </mesh>

          {/* Sculpted rounded hair volume (no boxy brim) */}
          <mesh position={[0, 0.225, -0.014]} scale={[0.96, 0.9, 1.0]}>
            <sphereGeometry
              args={[0.146, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]}
            />
            <meshStandardMaterial {...makeMat(HAIR_COLOR, 0.7)} />
          </mesh>
          <mesh
            position={[0.02, 0.285, 0.048]}
            rotation={[-0.2, 0.15, -0.12]}
            scale={[1.05, 0.52, 0.85]}
          >
            <sphereGeometry args={[0.115, 16, 14]} />
            <meshStandardMaterial {...makeMat(HAIR_COLOR, 0.7)} />
          </mesh>
          <mesh
            position={[-0.075, 0.26, 0.035]}
            rotation={[0, 0, 0.25]}
            scale={[0.62, 0.5, 0.72]}
          >
            <sphereGeometry args={[0.095, 14, 12]} />
            <meshStandardMaterial {...makeMat(HAIR_COLOR, 0.7)} />
          </mesh>

          {/* Ears */}
          <mesh position={[-0.132, 0.17, 0]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial {...makeMat(SKIN_COLOR, 0.62)} />
          </mesh>
          <mesh position={[0.132, 0.17, 0]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial {...makeMat(SKIN_COLOR, 0.62)} />
          </mesh>

          {/* Expressive Facial Features */}
          {!ghostMode ? (
            <>
              <mesh position={[-0.046, 0.184, 0.134]} scale={[1, eyeScaleY, 0.6]}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshStandardMaterial color="#0D1019" roughness={0.22} />
              </mesh>
              <mesh position={[0.046, 0.184, 0.134]} scale={[1, eyeScaleY, 0.6]}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshStandardMaterial color="#0D1019" roughness={0.22} />
              </mesh>

              {/* Specular highlights */}
              <mesh position={[-0.041, 0.19, 0.144]}>
                <sphereGeometry args={[0.0042, 6, 6]} />
                <meshBasicMaterial color={THEME_COLORS.accents.white} />
              </mesh>
              <mesh position={[0.051, 0.19, 0.144]}>
                <sphereGeometry args={[0.0042, 6, 6]} />
                <meshBasicMaterial color={THEME_COLORS.accents.white} />
              </mesh>

              {/* Nose bridge */}
              <mesh position={[0, 0.158, 0.142]} rotation={[-0.18, 0, 0]}>
                <capsuleGeometry args={[0.009, 0.022, 6, 8]} />
                <meshStandardMaterial color="#DAA484" roughness={0.62} />
              </mesh>

              {/* Expressive curved-look eyebrows (capsuleGeometry defaults vertical, +PI/2 lies horizontal) */}
              <mesh
                position={[-0.046, 0.218 + browLift, 0.135]}
                rotation={[0, 0, Math.PI / 2 + browTilt]}
              >
                <capsuleGeometry args={[0.0055, 0.028, 6, 8]} />
                <meshStandardMaterial color={HAIR_COLOR} roughness={0.7} />
              </mesh>
              <mesh
                position={[0.046, 0.218 + browLift, 0.135]}
                rotation={[0, 0, Math.PI / 2 - browTilt]}
              >
                <capsuleGeometry args={[0.0055, 0.028, 6, 8]} />
                <meshStandardMaterial color={HAIR_COLOR} roughness={0.7} />
              </mesh>

              {/* Mouth */}
              <mesh
                position={[0, 0.114, 0.132]}
                rotation={[0, 0, Math.PI / 2]}
                scale={[1 + surpriseAmount * 0.65, 1 - surpriseAmount * 0.35, 1]}
              >
                <capsuleGeometry args={[0.006, 0.022, 6, 8]} />
                <meshStandardMaterial color="#9E5E50" roughness={0.55} />
              </mesh>
            </>
          ) : null}
        </group>
      </group>
    </group>
  );
};

/**
 * Consistent stylized 3D human character reused across Scene 1, 2, 4, and 5.
 */
export const Character3D: React.FC<Character3DProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  walkPhase = 0,
  walkIntensity = 0,
  headTurnY = 0,
  headTiltX = 0,
  surpriseAmount = 0,
  blinkAmount = 0,
  echoOpacity = 0,
  echoOffset = [0.3, 0.03, -0.18],
}) => {
  return (
    <group position={[position[0], position[1], position[2]]}>
      <group rotation={[0, rotationY, 0]}>
        <FigureBody
          walkPhase={walkPhase}
          walkIntensity={walkIntensity}
          headTurnY={headTurnY}
          headTiltX={headTiltX}
          surpriseAmount={surpriseAmount}
          blinkAmount={blinkAmount}
        />
      </group>

      {/* Contact shadow */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#070A12" transparent opacity={0.48} />
      </mesh>

      {/* Translucent cyan hologram wireframe echo during déjà vu beat */}
      {echoOpacity > 0.01 ? (
        <group
          position={[echoOffset[0], echoOffset[1], echoOffset[2]]}
          rotation={[0, rotationY, 0]}
        >
          <FigureBody
            walkPhase={walkPhase}
            walkIntensity={walkIntensity}
            headTurnY={headTurnY}
            headTiltX={headTiltX}
            surpriseAmount={surpriseAmount}
            blinkAmount={blinkAmount}
            ghostMode
            ghostOpacity={echoOpacity}
          />
        </group>
      ) : null}
    </group>
  );
};
