import type React from "react";
import { THEME_COLORS } from "../../theme";

export type ModernRoom3DProps = {
  /** 0 = closed, 1 = open inward (~72 deg) */
  readonly doorOpenProgress?: number;
  /** 0..1 intensity of translucent déjà vu duplicate room echo */
  readonly ghostIntensity?: number;
  /** Positional offset for the déjà vu double-vision echo */
  readonly ghostOffset?: readonly [number, number, number];
  /** 0..1 progressive object edge highlight (reused in Scene 2 Shot 2) */
  readonly objectHighlight?: number;
};

const SLATE_WALL = "#192546";
const SLATE_CEILING = "#111932";
const SLATE_FLOOR = "#121C35";
const WOOD_ACCENT = "#5C4334";
const DESK_TOP = "#48352A";
const METAL_DARK = "#243356";

type RoomFurnitureProps = {
  readonly doorAngle: number;
  readonly ghostMode?: boolean;
  readonly ghostOpacity?: number;
  readonly objectHighlight?: number;
};

const RoomFurnitureAndStructure: React.FC<RoomFurnitureProps> = ({
  doorAngle,
  ghostMode = false,
  ghostOpacity = 0.24,
  objectHighlight = 0,
}) => {
  const ghostMat = {
    color: THEME_COLORS.accents.cyan,
    emissive: THEME_COLORS.accents.cyan,
    emissiveIntensity: 0.78,
    transparent: true,
    opacity: ghostOpacity * 0.36,
    depthWrite: false,
  } as const;

  const ghostAmberMat = {
    color: THEME_COLORS.accents.amber,
    emissive: THEME_COLORS.accents.amber,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: ghostOpacity * 0.28,
    depthWrite: false,
  } as const;

  const hlGlow = !ghostMode ? objectHighlight * 0.55 : 0;

  return (
    <group>
      {/* Doorway cutout frame (back-left wall) */}
      <group position={[-1.24, 0, -2.26]}>
        <mesh position={[-0.45, 1.08, 0]}>
          <boxGeometry args={[0.08, 2.16, 0.14]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color={METAL_DARK} roughness={0.45} />
          )}
        </mesh>
        <mesh position={[0.45, 1.08, 0]}>
          <boxGeometry args={[0.08, 2.16, 0.14]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color={METAL_DARK} roughness={0.45} />
          )}
        </mesh>
        <mesh position={[0, 2.14, 0]}>
          <boxGeometry args={[0.98, 0.08, 0.14]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color={METAL_DARK} roughness={0.45} />
          )}
        </mesh>

        {/* Exterior cool hallway glow behind door */}
        {!ghostMode ? (
          <mesh position={[0, 1.05, -0.055]}>
            <planeGeometry args={[0.82, 2.08]} />
            <meshBasicMaterial color="#21407A" />
          </mesh>
        ) : null}

        {/* Hinged swinging door */}
        <group position={[-0.41, 0, 0.02]} rotation={[0, doorAngle, 0]}>
          <mesh position={[0.41, 1.05, 0]}>
            <boxGeometry args={[0.82, 2.08, 0.05]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostMat} />
            ) : (
              <meshStandardMaterial color="#23345D" roughness={0.5} />
            )}
          </mesh>
          {/* Frosted glass inset */}
          <mesh position={[0.41, 1.25, 0]}>
            <boxGeometry args={[0.46, 0.94, 0.06]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostAmberMat} />
            ) : (
              <meshStandardMaterial
                color="#3266A3"
                emissive={THEME_COLORS.accents.cyan}
                emissiveIntensity={0.3 + hlGlow * 0.4}
                transparent
                opacity={0.82}
              />
            )}
          </mesh>
          {/* Brass handle */}
          {!ghostMode ? (
            <mesh position={[0.7, 0.98, 0.045]}>
              <boxGeometry args={[0.1, 0.03, 0.04]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>
          ) : null}
        </group>
      </group>

      {/* Framed artwork on center back wall */}
      <group position={[-0.12, 1.62, -2.26]}>
        <mesh>
          <boxGeometry args={[0.66, 0.86, 0.05]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color="#10182E" roughness={0.5} />
          )}
        </mesh>
        {!ghostMode ? (
          <>
            <mesh position={[0, 0, 0.028]}>
              <planeGeometry args={[0.54, 0.74]} />
              <meshStandardMaterial color="#1A294D" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.06, 0.032]}>
              <torusGeometry args={[0.145, 0.017, 12, 32]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                emissive={THEME_COLORS.accents.amber}
                emissiveIntensity={0.55}
              />
            </mesh>
            <mesh position={[0, -0.17, 0.032]}>
              <boxGeometry args={[0.34, 0.02, 0.01]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.cyan}
                emissive={THEME_COLORS.accents.cyan}
                emissiveIntensity={0.6}
              />
            </mesh>
          </>
        ) : null}
      </group>

      {/* Large modern window (back-right) */}
      <group position={[1.1, 1.62, -2.26]}>
        <mesh>
          <boxGeometry args={[1.48, 1.68, 0.1]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color={METAL_DARK} roughness={0.45} />
          )}
        </mesh>
        {/* Glowing twilight cyan sky glass */}
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[1.34, 1.52]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial
              color="#225794"
              emissive={THEME_COLORS.accents.cyan}
              emissiveIntensity={0.52 + hlGlow * 0.3}
              roughness={0.18}
            />
          )}
        </mesh>
        {/* Window mullions */}
        {!ghostMode ? (
          <>
            <mesh position={[0, 0, 0.036]}>
              <boxGeometry args={[0.045, 1.54, 0.04]} />
              <meshStandardMaterial color={METAL_DARK} />
            </mesh>
            <mesh position={[0, 0.18, 0.036]}>
              <boxGeometry args={[1.36, 0.045, 0.04]} />
              <meshStandardMaterial color={METAL_DARK} />
            </mesh>
          </>
        ) : null}
      </group>

      {/* Modern Desk (center-right midground) */}
      <group position={[0.88, 0, -0.68]}>
        <mesh position={[0, 0.74, 0]}>
          <boxGeometry args={[1.22, 0.065, 0.66]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostAmberMat} />
          ) : (
            <meshStandardMaterial
              color={DESK_TOP}
              emissive={THEME_COLORS.accents.cyan}
              emissiveIntensity={hlGlow * 0.28}
              roughness={0.48}
            />
          )}
        </mesh>

        {[
          [-0.52, 0.36, -0.25],
          [-0.52, 0.36, 0.25],
          [0.52, 0.36, -0.25],
          [0.52, 0.36, 0.25],
        ].map(([lx, ly, lz], idx) => (
          <mesh key={idx} position={[lx, ly, lz]}>
            <boxGeometry args={[0.042, 0.72, 0.042]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostMat} />
            ) : (
              <meshStandardMaterial
                color={METAL_DARK}
                metalness={0.5}
                roughness={0.4}
              />
            )}
          </mesh>
        ))}

        {/* Open laptop */}
        <group position={[-0.14, 0.775, -0.02]} rotation={[0, -0.22, 0]}>
          <mesh position={[0, 0.01, 0.065]}>
            <boxGeometry args={[0.34, 0.016, 0.22]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostMat} />
            ) : (
              <meshStandardMaterial
                color="#2A3C66"
                metalness={0.4}
                roughness={0.4}
              />
            )}
          </mesh>
          <mesh position={[0, 0.115, -0.045]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.34, 0.22, 0.015]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostMat} />
            ) : (
              <meshStandardMaterial
                color="#1E3059"
                emissive={THEME_COLORS.accents.cyan}
                emissiveIntensity={0.42}
              />
            )}
          </mesh>
        </group>

        {/* Notebook & ceramic mug */}
        {!ghostMode ? (
          <>
            <mesh position={[0.3, 0.785, 0.08]} rotation={[0, 0.18, 0]}>
              <boxGeometry args={[0.19, 0.022, 0.24]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                roughness={0.55}
              />
            </mesh>
            <mesh position={[0.4, 0.82, -0.14]}>
              <cylinderGeometry args={[0.04, 0.036, 0.09, 16]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
            </mesh>
          </>
        ) : null}
      </group>

      {/* Modern Chair */}
      <group position={[0.84, 0, 0.04]} rotation={[0, 2.74, 0]}>
        <mesh position={[0, 0.44, 0]}>
          <boxGeometry args={[0.44, 0.06, 0.42]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial
              color="#283B69"
              emissive={THEME_COLORS.accents.cyan}
              emissiveIntensity={hlGlow * 0.28}
              roughness={0.55}
            />
          )}
        </mesh>
        <mesh position={[0, 0.71, -0.18]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.42, 0.44, 0.055]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color="#213159" roughness={0.55} />
          )}
        </mesh>
        {[
          [-0.18, 0.22, -0.16],
          [0.18, 0.22, -0.16],
          [-0.18, 0.22, 0.16],
          [0.18, 0.22, 0.16],
        ].map(([cx, cy, cz], idx) => (
          <mesh key={idx} position={[cx, cy, cz]}>
            <cylinderGeometry args={[0.02, 0.016, 0.44, 10]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostMat} />
            ) : (
              <meshStandardMaterial
                color={METAL_DARK}
                metalness={0.5}
                roughness={0.4}
              />
            )}
          </mesh>
        ))}
      </group>

      {/* Hanging Pendant Lamp reaching smoothly up to full-height ceiling */}
      <group position={[0.88, 2.02, -0.68]}>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.56, 8]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color={METAL_DARK} />
          )}
        </mesh>
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.26, 0.2, 22, 1, true]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostAmberMat} />
          ) : (
            <meshStandardMaterial
              color="#25355C"
              metalness={0.45}
              roughness={0.38}
              side={2}
            />
          )}
        </mesh>
        <mesh position={[0, -0.045, 0]}>
          <sphereGeometry args={[0.072, 14, 14]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostAmberMat} />
          ) : (
            <meshStandardMaterial
              color={THEME_COLORS.accents.amber}
              emissive={THEME_COLORS.accents.amber}
              emissiveIntensity={1.8}
            />
          )}
        </mesh>
      </group>

      {/* Architectural planter with stylized leaves */}
      <group position={[1.76, 0, -1.78]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.18, 0.14, 0.44, 16]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color="#24355C" roughness={0.58} />
          )}
        </mesh>
        {[
          [0, 0.58, 0, 0.2, 0.4],
          [-0.09, 0.54, 0.07, -0.35, 1.2],
          [0.09, 0.56, -0.05, 0.35, -0.8],
          [0.02, 0.66, 0.04, 0.15, 2.2],
        ].map(([lx, ly, lz, rotX, rotY], idx) => (
          <mesh
            key={idx}
            position={[lx, ly, lz]}
            rotation={[rotX, rotY, 0.15]}
            scale={[0.55, 1.45, 0.22]}
          >
            <sphereGeometry args={[0.14, 10, 10]} />
            {ghostMode ? (
              <meshStandardMaterial {...ghostMat} />
            ) : (
              <meshStandardMaterial color="#258068" roughness={0.55} />
            )}
          </mesh>
        ))}
      </group>

      {/* Left Wall Credenza & Decor Lamp */}
      <group position={[-1.92, 0, -0.78]}>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.46, 0.64, 1.24]} />
          {ghostMode ? (
            <meshStandardMaterial {...ghostMat} />
          ) : (
            <meshStandardMaterial color={WOOD_ACCENT} roughness={0.58} />
          )}
        </mesh>
        {!ghostMode ? (
          <>
            <mesh position={[0, 0.72, -0.3]}>
              <cylinderGeometry args={[0.095, 0.125, 0.15, 16]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.amber}
                emissive={THEME_COLORS.accents.amber}
                emissiveIntensity={0.8}
              />
            </mesh>
            <mesh position={[0.02, 0.75, 0.26]}>
              <boxGeometry args={[0.22, 0.17, 0.065]} />
              <meshStandardMaterial
                color={THEME_COLORS.accents.cyan}
                roughness={0.45}
              />
            </mesh>
            <mesh position={[0.02, 0.76, 0.35]}>
              <boxGeometry args={[0.22, 0.19, 0.058]} />
              <meshStandardMaterial color="#3B528A" roughness={0.5} />
            </mesh>
          </>
        ) : null}
      </group>
    </group>
  );
};

/**
 * Full-screen architectural modern room 3D environment shared across Scene 1, 2, 4, and 5.
 */
export const ModernRoom3D: React.FC<ModernRoom3DProps> = ({
  doorOpenProgress = 0.85,
  ghostIntensity = 0,
  ghostOffset = [0.22, 0.04, -0.14],
  objectHighlight = 0,
}) => {
  const doorAngle = -doorOpenProgress * 1.24;

  return (
    <group>
      {/* Seamless continuous floor plane */}
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color={SLATE_FLOOR} roughness={0.78} />
      </mesh>

      {/* Architectural rug with warm amber trim border extending toward center foreground */}
      <mesh position={[0.18, 0.006, -0.1]}>
        <boxGeometry args={[2.55, 0.01, 2.7]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.amber}
          emissive={THEME_COLORS.accents.amber}
          emissiveIntensity={0.2}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0.18, 0.01, -0.1]}>
        <boxGeometry args={[2.47, 0.012, 2.62]} />
        <meshStandardMaterial color="#19284C" roughness={0.86} />
      </mesh>

      {/* Wide continuous back wall */}
      <mesh position={[0, 2.2, -2.36]}>
        <boxGeometry args={[16, 4.8, 0.16]} />
        <meshStandardMaterial color={SLATE_WALL} roughness={0.75} />
      </mesh>

      {/* Left continuous wall with architectural wood slats */}
      <mesh position={[-2.24, 2.2, 1.5]}>
        <boxGeometry args={[0.16, 4.8, 12]} />
        <meshStandardMaterial color={SLATE_WALL} roughness={0.75} />
      </mesh>
      {[-1.55, -1.3, -1.05, -0.8, -0.55].map((zPos, i) => (
        <mesh key={i} position={[-2.14, 1.65, zPos]}>
          <boxGeometry args={[0.04, 3.3, 0.065]} />
          <meshStandardMaterial color={WOOD_ACCENT} roughness={0.55} />
        </mesh>
      ))}

      {/* Right continuous wall */}
      <mesh position={[2.65, 2.2, 1.5]}>
        <boxGeometry args={[0.16, 4.8, 12]} />
        <meshStandardMaterial color={SLATE_WALL} roughness={0.75} />
      </mesh>

      {/* Full-span architectural ceiling & cove glow */}
      <mesh position={[0, 3.45, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color={SLATE_CEILING} roughness={0.82} />
      </mesh>
      <mesh position={[0, 3.36, -2.24]}>
        <boxGeometry args={[5.4, 0.035, 0.04]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.cyan}
          emissive={THEME_COLORS.accents.cyan}
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh position={[-2.13, 3.36, 0.2]}>
        <boxGeometry args={[0.04, 0.035, 5.2]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.cyan}
          emissive={THEME_COLORS.accents.cyan}
          emissiveIntensity={0.65}
        />
      </mesh>

      {/* Window cool light spill on floor */}
      <mesh position={[1.1, 0.014, -1.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.45, 1.85]} />
        <meshBasicMaterial
          color={THEME_COLORS.accents.cyan}
          transparent
          opacity={0.11}
        />
      </mesh>

      {/* Warm amber downlight from pendant lamp */}
      <pointLight
        position={[0.88, 1.82, -0.68]}
        color={THEME_COLORS.accents.amber}
        intensity={4.5}
        distance={5.5}
      />

      {/* Cool fill light from window */}
      <pointLight
        position={[1.1, 1.55, -1.5]}
        color={THEME_COLORS.accents.cyan}
        intensity={2.8}
        distance={6.0}
      />

      {/* Main furniture & architectural features */}
      <RoomFurnitureAndStructure
        doorAngle={doorAngle}
        objectHighlight={objectHighlight}
      />

      {/* Déjà vu translucent duplicate double-vision echo */}
      {ghostIntensity > 0.01 ? (
        <group
          position={[ghostOffset[0], ghostOffset[1], ghostOffset[2]]}
        >
          <RoomFurnitureAndStructure
            doorAngle={doorAngle}
            ghostMode
            ghostOpacity={ghostIntensity}
          />
        </group>
      ) : null}
    </group>
  );
};
