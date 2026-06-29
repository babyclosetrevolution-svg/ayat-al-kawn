import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { RENDER_CONFIG } from "./RenderConfig";
import { FocusRegistry } from "../world/state/focus";

/**
 * AutoExposure — animates gl.toneMappingExposure based on the camera's
 * proximity to the dominant light source (the Sun). Closer = lower exposure
 * to avoid blowing out the bright disc; farther = open up so deep space and
 * outer planets stay readable.
 *
 * Purely physically inspired: no fancy luminance histograms, just a smooth
 * distance falloff fed through a soft S-curve.
 */
function AutoExposure() {
  const { gl } = useThree();
  const target = useRef(RENDER_CONFIG.exposure.base);

  useFrame((state, delta) => {
    const sun = FocusRegistry.get("sun");
    const sunPos = sun?.position ?? new THREE.Vector3();
    const d = state.camera.position.distanceTo(sunPos);

    // Map distance → exposure: very close ⇒ min, very far ⇒ max.
    // Soft transition centered around mid-system distances.
    const near = 30;
    const far = 600;
    const t = THREE.MathUtils.clamp((d - near) / (far - near), 0, 1);
    const eased = t * t * (3 - 2 * t);
    const { min, max, rate } = RENDER_CONFIG.exposure;
    const desired = min + (max - min) * eased;
    target.current = desired;

    const k = 1 - Math.exp(-rate * delta);
    gl.toneMappingExposure += (target.current - gl.toneMappingExposure) * k;
  });

  return null;
}

/**
 * PostFX — single composer mounting the bloom pass. Keeps the post-process
 * stack centralized so future passes (vignette, chromatic aberration,
 * starburst) plug in alongside without scattering across files.
 */
export function PostFX() {
  const cfg = RENDER_CONFIG.bloom;
  return (
    <>
      <AutoExposure />
      {cfg.enabled && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={cfg.intensity}
            luminanceThreshold={cfg.luminanceThreshold}
            luminanceSmoothing={cfg.luminanceSmoothing}
            mipmapBlur
            radius={cfg.radius}
            kernelSize={KernelSize.LARGE}
            resolutionScale={cfg.resolutionScale}
          />
        </EffectComposer>
      )}
    </>
  );
}
