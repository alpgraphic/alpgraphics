"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function IceCube({ isNight }: { isNight: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.SpotLight>(null);
    const pointLightRef = useRef<THREE.PointLight>(null);
    const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());
    useMemo(() => {
        targetRef.current.name = "searchlight-target";
    }, []);
    const { scene, size } = useThree();

    // Tracking state
    const currentTargetPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
    const activeTargetId = useRef<string | null>(null);

    // Initial Position State:
    // Day -> Start inside (-2.65 relative)
    // Night -> Start outside (0 relative)
    const [initialY] = useState(isNight ? 0 : -2.65);

    // Initial Scale State:
    // Day -> Start at 0 (Invisible)
    // Night -> Start at 1 (Visible)
    const [initialScaleVal] = useState(isNight ? 1 : 0);

    // Initial Position State (Z-axis):
    // Day -> Start further back (-8 relative)
    // Night -> Start at 0 (relative)
    const [initialZ] = useState(isNight ? 0 : -8);

    // FIXED: Use constant size to match DarkObject scaling (Camera handles play)
    // User: "görsel küçüldüğünde küp aşırı küçülüyor... diğerlerinde neyse aynı kalsın"
    const cubeSize = 1.4;

    // Spotlight distance adjusted for camera position
    const spotlightDistance = useMemo(() => {
        const isMobile = size.width < 768;
        return isMobile ? 80 : 50;
    }, [size.width]);

    // Shadow quality adjusted for performance (User Requested Reduction)
    const shadowMapSize = useMemo(() => {
        const isMobile = size.width < 768;
        // Mobile: 512 for performance, Desktop: 1024 for balance
        return isMobile ? 512 : 1024;
    }, [size.width]);

    // Position: Aligned with DarkObject (x moves from -9.1 to -5.1 on mobile)
    const projectorPos = useMemo(() => {
        const isMobile = size.width < 768;
        return isMobile
            ? new THREE.Vector3(-5.1, 5.3, -4)  // Mobile: Almost Centered
            : new THREE.Vector3(-9.1, 5.3, -4); // Desktop: Left aligned
    }, [size.width]);

    // Material ref for the front face (emissive)
    const emissiveMatRef = useRef<THREE.MeshStandardMaterial>(null);

    // Pre-allocate reusable objects to avoid GC pressure (60 allocations/sec -> 0)
    const idlePos = useMemo(() => new THREE.Vector3(0, 0, 5), []);
    const colorOn = useMemo(() => new THREE.Color("#ffffcc"), []);
    const colorOff = useMemo(() => new THREE.Color("#1a1a1a"), []);

    useFrame((state, delta) => {
        if (!meshRef.current || !lightRef.current) return;

        // FIXED: No Movement/Scaling Animation (User Request: "küp gidip gelmese hep aynı konumda kalsa")
        // The cube stays static at [0, 0, 0] relative to parent.
        // We only animate the LIGHTS.

        // ---------------------------------------------------------
        // TRACKING LOGIC (Always run)
        // ---------------------------------------------------------

        // 1. Direct Target Selection (Single Thief)
        const thief = scene.getObjectByName("single-thief-cube");
        let targetFound = false;

        // Track if it's visible (above ground)
        if (thief && thief.position.y > -1) {
            currentTargetPos.lerp(thief.position, 10 * delta);
            targetFound = true;
        }

        // 2. Idle Logic (Target the floor design center - reuse pre-allocated vector)
        if (!targetFound) {
            currentTargetPos.lerp(idlePos, 1.5 * delta);
            activeTargetId.current = null;
        }

        // 3. Head-tracking (Rotate cube to look at target)
        meshRef.current.lookAt(currentTargetPos);

        // 4. Update Light Target (Spotlight follows target)
        if (!scene.getObjectByName("searchlight-target-world")) {
            targetRef.current.name = "searchlight-target-world";
            scene.add(targetRef.current);
        }
        targetRef.current.position.set(currentTargetPos.x, currentTargetPos.y, currentTargetPos.z);
        lightRef.current.target = targetRef.current;
        lightRef.current.target.updateMatrixWorld();

        // ---------------------------------------------------------
        // LIGHT & COLOR TIMING (Fade In/Out on Click)
        // ---------------------------------------------------------

        // Lights Intensity Targets
        const targetSpotIntensity = isNight ? 1500 : 0;
        const targetPointIntensity = isNight ? 2 : 0;

        // Emissive Intensity Target
        const targetEmissive = isNight ? 100 : 0;

        // Slower Fade Speed ("yavaştan yansa")
        const fadeSpeed = delta * 2;

        // Lerp Lights
        lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetSpotIntensity, fadeSpeed);
        if (pointLightRef.current) {
            pointLightRef.current.intensity = THREE.MathUtils.lerp(pointLightRef.current.intensity, targetPointIntensity, fadeSpeed);
        }

        // Emissive Face (White Shine)
        if (emissiveMatRef.current) {
            // 1. Lerp Intensity
            emissiveMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
                emissiveMatRef.current.emissiveIntensity,
                targetEmissive,
                fadeSpeed
            );

            // 2. Lerp Color (Match body #1a1a1a when off, #ffffcc when on) - reuse pre-allocated colors
            emissiveMatRef.current.color.lerp(isNight ? colorOn : colorOff, fadeSpeed);
        }
    });

    return (
        <group position={[projectorPos.x, projectorPos.y, projectorPos.z]}>
            <mesh
                ref={meshRef}
                position={[0, 0, 0]} // Fixed Position (Relative to projectorPos)
                scale={[1, 1, 1]}    // Fixed Scale
            >
                <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />

                <meshStandardMaterial
                    attach="material-0"
                    color="#1a1a1a"
                    roughness={0.2}
                    metalness={0.1}
                />
                <meshStandardMaterial attach="material-1" color="#1a1a1a" roughness={0.2} metalness={0.1} />
                <meshStandardMaterial attach="material-2" color="#1a1a1a" roughness={0.2} metalness={0.1} />
                <meshStandardMaterial attach="material-3" color="#1a1a1a" roughness={0.2} metalness={0.1} />

                <meshStandardMaterial
                    ref={emissiveMatRef}
                    attach="material-4"
                    emissive="#ffffcc"
                    emissiveIntensity={0} // Start dark/off controlled by useFrame
                    color="#1a1a1a"        // Start as body color (#1a1a1a), animate to #ffffcc
                    metalness={0.1}
                    roughness={0.1}
                    transparent={true}
                    opacity={1}
                    side={THREE.DoubleSide}
                />

                <meshStandardMaterial attach="material-5" color="#1a1a1a" roughness={0.2} metalness={0.1} />

                {/* Only cast light if visible (or let it sink too) - it's attached to mesh, so it sinks */}
                <spotLight
                    ref={lightRef}
                    position={[0, 0, 0]}
                    intensity={0} // Controlled in useFrame
                    angle={0.5}
                    penumbra={0.4}
                    castShadow
                    shadow-mapSize-width={shadowMapSize}
                    shadow-mapSize-height={shadowMapSize}
                    shadow-camera-near={0.5}
                    shadow-camera-far={spotlightDistance}
                    shadow-bias={-0.00005}
                />

                <pointLight ref={pointLightRef} intensity={0} distance={5} color="#ffffcc" />
            </mesh>
        </group>
    );
}