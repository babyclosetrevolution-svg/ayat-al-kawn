import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import * as THREE from "three";
import { ENGINE_CONFIG } from "../core/config";
import { CameraSystem } from "./CameraSystem";
import { LightingSystem } from "./LightingSystem";
import { SimulationClock } from "../sim";

interface EngineProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Engine — root R3F surface.
 * Owns renderer config, color management, camera and lighting systems.
 * Worlds and UI overlays mount inside.
 */
export function Engine({ children, fallback = null }: EngineProps) {
  return (
    <Canvas
      dpr={ENGINE_CONFIG.renderer.dpr}
      gl={{
        antialias: ENGINE_CONFIG.renderer.antialias,
        powerPreference: ENGINE_CONFIG.renderer.powerPreference,
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{
        fov: ENGINE_CONFIG.camera.fov,
        near: ENGINE_CONFIG.camera.near,
        far: ENGINE_CONFIG.camera.far,
        position: ENGINE_CONFIG.camera.position,
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 1);
        scene.background = new THREE.Color(0x000000);
      }}
    >
      <Suspense fallback={fallback}>
        <SimulationClock />
        <LightingSystem />
        <CameraSystem />
        {children}
      </Suspense>
    </Canvas>
  );
}
