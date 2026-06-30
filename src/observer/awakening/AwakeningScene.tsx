import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AwakeningStars, DistantSun } from "./AwakeningStars";
import { BeaconField, makeBeacons, type BeaconSpec } from "./BeaconField";
import { FlightController, type InputBindingHandle } from "../flight";
import { Observer } from "../core/Observer";
import type { ObserverMode } from "../types";

/**
 * AwakeningScene — independent R3F canvas that hosts the Observer
 * Awakening. It mounts only during the introduction and unmounts cleanly
 * before the main Universe is revealed, so the existing rendering engine
 * is never reconfigured mid-flight.
 */

interface SceneProps {
  /** Reveal factor (0..1) of the distant Sun, driven by stage progress. */
  sunReveal: number;
  /** Active beacon index — guides the lesson visually. */
  activeBeacon: number;
  beacons: BeaconSpec[];
  bindings: InputBindingHandle;
  controller: FlightController;
  onMetrics: (m: {
    speed: number;
    nearestBeaconDistance: number;
    rotationDelta: number;
  }) => void;
}

function FlightDriver({
  bindings,
  controller,
  beacons,
  activeBeacon,
  onMetrics,
}: Omit<SceneProps, "sunReveal">) {
  const { camera } = useThree();
  const lastQuat = useRef(new THREE.Quaternion());
  const initialized = useRef(false);

  useEffect(() => {
    camera.position.set(0, 0, 0);
    camera.quaternion.identity();
    controller.initFromCamera(camera);
    lastQuat.current.copy(camera.quaternion);
    initialized.current = true;
    Observer.setMode("learning" as ObserverMode);
  }, [camera, controller]);

  useFrame((_, dt) => {
    if (!initialized.current) return;
    const persp = camera as THREE.PerspectiveCamera;
    const target = beacons[activeBeacon];
    const dist = target ? camera.position.distanceTo(target.position) : null;
    controller.apply(bindings.state, persp, dt, dist);

    // Rotation delta for the "look" stage detector.
    const q = camera.quaternion;
    const dot = Math.min(1, Math.abs(lastQuat.current.dot(q)));
    const angle = 2 * Math.acos(dot);
    lastQuat.current.copy(q);

    onMetrics({
      speed: controller.currentSpeed(),
      nearestBeaconDistance:
        dist ?? Number.POSITIVE_INFINITY,
      rotationDelta: angle,
    });
  });

  return null;
}

export function AwakeningScene(props: SceneProps) {
  const { sunReveal, activeBeacon, beacons } = props;
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 0.1, far: 8000, position: [0, 0, 0] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 1);
        scene.background = new THREE.Color(0x000000);
      }}
    >
      <AwakeningStars />
      <BeaconField beacons={beacons} activeIndex={activeBeacon} />
      <DistantSun opacity={sunReveal} />
      <FlightDriver {...props} />
    </Canvas>
  );
}

export function useBeacons(): BeaconSpec[] {
  return useMemo(() => makeBeacons(), []);
}
