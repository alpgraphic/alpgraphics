"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import IceCube from "./IceCube";
import ThiefCubes from "./ThiefCubes";
import { FloorButton } from "./FloorButton";
import { DarkObject } from "./DarkObject";

export interface SceneConfig {
    dayImage: string | null;
    nightImage: string | null;
    dayPosition: { x: number; y: number; z: number };
    nightPosition: { x: number; y: number; z: number };
    dayWidth: { desktop: number; mobile: number };
    nightWidth: { desktop: number; mobile: number };
    imageAspect: number;
}

const DEFAULT_CONFIG: SceneConfig = {
    dayImage: null,
    nightImage: null,
    dayPosition: { x: 0, y: 0.01, z: 0 },
    nightPosition: { x: 0, y: 0.02, z: 0 },
    dayWidth: { desktop: 20, mobile: 15 },
    nightWidth: { desktop: 20, mobile: 19 },
    imageAspect: 16 / 9,
};

export default function Scene({ isNight = false, toggleTheme }: { isNight?: boolean; toggleTheme?: () => void }) {
    const [config, setConfig] = React.useState<SceneConfig>(DEFAULT_CONFIG);

    React.useEffect(() => {
        fetch('/api/site-settings')
            .then(r => r.json())
            .then(data => {
                if (data.settings) setConfig({ ...DEFAULT_CONFIG, ...data.settings });
            })
            .catch(console.error);
    }, []);

    return (
        <div className="absolute inset-0 z-0 w-full h-full">
            <Canvas
                shadows
                dpr={[1, 1.5]}
                camera={{ position: [0, 20, 14], fov: 55, near: 0.1, far: 100 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    shadowMapType: THREE.PCFSoftShadowMap
                }}
                className="w-full h-full"
            >
                <Suspense fallback={<Html center></Html>}>
                    <ambientLight intensity={isNight ? 0.2 : 4} />
                    <Environment preset="city" environmentIntensity={isNight ? 0.2 : 1} />

                    <CameraHandler isNight={isNight} />

                    <Suspense fallback={null}>
                        <ResponsiveScene isNight={isNight} config={config} />
                    </Suspense>

                    <IceCube isNight={isNight} />
                    <DarkObject />
                    <ThiefCubes />
                    <Suspense fallback={null}>
                        <FloorButton isNight={isNight} toggleTheme={toggleTheme} />
                    </Suspense>
                </Suspense>
            </Canvas>
        </div>
    );
}

function CameraHandler({ isNight }: { isNight: boolean }) {
    const { camera, size } = useThree();
    // Pre-allocate vector to avoid creating new objects every frame (60fps = 60 allocations/sec)
    const targetPos = useMemo(() => new THREE.Vector3(), []);

    useFrame((state, delta) => {
        const isMobile = size.width < 768;

        // Reuse pre-allocated vector
        if (isMobile) {
            targetPos.set(0, 30, 20);
        } else {
            targetPos.set(0, 20, 14);
        }

        // Smoothly lerp camera position
        state.camera.position.lerp(targetPos, delta * 0.5);
        state.camera.lookAt(0, 0, 0);
    });

    // Initial setup (optional, but good for first render)
    useEffect(() => {
        const isMobile = size.width < 768;
        if (!camera.position.x && !camera.position.y && !camera.position.z) {
            // Set instant initial pos if not set to prevent jump
            if (isMobile) camera.position.set(0, 30, 20);
            else camera.position.set(0, 20, 14);
        }
    }, [size.width]);

    return null;
}

function ResponsiveScene({ isNight, config }: { isNight: boolean; config: SceneConfig }) {
    const { size } = useThree();
    // Load BOTH textures at start so they are ready
    const dayTextureSrc = config.dayImage || "/backgrounds.svg";
    const nightTextureSrc = config.nightImage || "/backgrounds_2.svg";
    const [dayTexture, nightTexture] = useTexture([dayTextureSrc, nightTextureSrc]);
    const dayPlaneRef = React.useRef<THREE.Mesh>(null);
    const nightPlaneRef = React.useRef<THREE.Mesh>(null);
    const floorMaterialRef = React.useRef<THREE.MeshStandardMaterial>(null);

    // Configure textures via useEffect (proper React side-effect handling)
    // Only runs when texture objects change, not every render frame
    useEffect(() => {
        [dayTexture, nightTexture].forEach(t => {
            t.anisotropy = 16;
            t.colorSpace = THREE.SRGBColorSpace;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            t.magFilter = THREE.LinearFilter;
            t.generateMipmaps = true;
            t.wrapS = THREE.ClampToEdgeWrapping;
            t.wrapT = THREE.ClampToEdgeWrapping;
            t.needsUpdate = true;
        });
    }, [dayTexture, nightTexture]);

    const isMobile = size.width < 768;
    const imageAspect = config.imageAspect || 16 / 9;

    const { dayWidth, nightWidth } = useMemo(() => {
        if (!isMobile) {
            return { dayWidth: config.dayWidth.desktop, nightWidth: config.nightWidth.desktop };
        } else {
            return { dayWidth: config.dayWidth.mobile, nightWidth: config.nightWidth.mobile };
        }
    }, [isMobile, config]);

    const dayHeight = dayWidth / imageAspect;
    const nightHeight = nightWidth / imageAspect;

    // Pre-allocate color objects to avoid GC pressure (60 allocations/sec -> 0)
    const floorColorDay = useMemo(() => new THREE.Color("#f5f3e9"), []);
    const floorColorNight = useMemo(() => new THREE.Color("#080808"), []);

    useFrame((state, delta) => {
        // 1. Fade Night Plane Opacity
        if (nightPlaneRef.current) {
            const targetOpacity = isNight ? 1 : 0;
            const mat = nightPlaneRef.current.material as THREE.MeshStandardMaterial;
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 2);
        }

        // 2. Fade Day Plane Opacity (Cross-fade)
        if (dayPlaneRef.current) {
            const targetOpacity = isNight ? 0 : 1;
            const mat = dayPlaneRef.current.material as THREE.MeshStandardMaterial;
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 2);
        }

        // 3. Smoothly transition floor color (reuse pre-allocated Color objects)
        if (floorMaterialRef.current) {
            const targetColor = isNight ? floorColorNight : floorColorDay;
            floorMaterialRef.current.color.lerp(targetColor, delta * 2);
        }
    });

    return (
        <>
            {/* Day Layer (Bottom) - Fades Out in Night Mode */}
            <mesh
                ref={dayPlaneRef}
                position={[config.dayPosition.x, config.dayPosition.y, config.dayPosition.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={1}
            >
                <planeGeometry args={[dayWidth, dayHeight]} />
                <meshStandardMaterial
                    map={dayTexture}
                    transparent={true}
                    depthWrite={false}
                    opacity={1}
                    roughness={1}
                    metalness={0}
                    emissive="#000000"
                    emissiveIntensity={0}
                />
            </mesh>

            {/* Night Layer (Top) - Fades in/out */}
            <mesh
                ref={nightPlaneRef}
                position={[config.nightPosition.x, config.nightPosition.y, config.nightPosition.z]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={2}
            >
                <planeGeometry args={[nightWidth, nightHeight]} />
                <meshStandardMaterial
                    map={nightTexture}
                    transparent={true}
                    depthWrite={false}
                    opacity={0}
                    roughness={1}
                    metalness={0}
                    emissive="#000000"
                    emissiveIntensity={0}
                />
            </mesh>

            {/* Infinite Floor Plane */}
            <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={-11}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial
                    ref={floorMaterialRef}
                    color="#f5f3e9"
                    roughness={0.9}
                />
            </mesh>
        </>
    );
}
