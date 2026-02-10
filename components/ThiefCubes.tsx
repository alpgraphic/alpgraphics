"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ThiefCubes() {
    const meshRef = useRef<THREE.Mesh>(null);
    const { scene } = useThree();

    // Use a ref for phase to ensure synchronous logic update
    const phaseRef = useRef<'hidden' | 'rising' | 'hovering' | 'diving'>('hidden');
    const timer = useRef(0);
    const targetPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        timer.current -= delta;

        // --- Phase Transitions ---
        if (timer.current <= 0) {
            if (phaseRef.current === 'hidden') {
                // Determine new position
                targetPos.set(
                    (Math.random() - 0.5) * 12,
                    0,
                    (Math.random() - 0.5) * 6 + 4
                );
                meshRef.current.position.set(targetPos.x, -2, targetPos.z);
                phaseRef.current = 'rising';
                timer.current = 1.0;
            }
            else if (phaseRef.current === 'rising') {
                phaseRef.current = 'hovering';
                timer.current = 3.0;
            }
            else if (phaseRef.current === 'hovering') {
                phaseRef.current = 'diving';
                timer.current = 1.0;
            }
            else if (phaseRef.current === 'diving') {
                phaseRef.current = 'hidden';
                timer.current = 2.0;
                meshRef.current.visible = false;
            }
        }

        // --- Deterministic Animation (No lerp jitter) ---
        let y = -2;
        let scale = 0;
        let visible = false;

        if (phaseRef.current === 'rising') {
            visible = true;
            const progress = Math.min(1, 1 - (timer.current / 1.0));
            // Power curve for silky rise
            const ease = 1 - Math.pow(1 - progress, 4);
            y = ease * 1.1;
            scale = ease;
        }
        else if (phaseRef.current === 'hovering') {
            visible = true;
            y = 1.1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.12;
            scale = 1;
        }
        else if (phaseRef.current === 'diving') {
            visible = true;
            const progress = Math.min(1, 1 - (timer.current / 1.0));
            // Acceleration curve for diving
            const ease = progress * progress * progress;
            y = 1.1 - (ease * 3.5);
            scale = 1 - (ease * 0.8);
        }

        meshRef.current.position.y = y;
        meshRef.current.scale.setScalar(scale);
        meshRef.current.visible = visible;

        // Static positioning for the phase
        meshRef.current.position.x = targetPos.x;
        meshRef.current.position.z = targetPos.z;
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                name="single-thief-cube"
                castShadow
                receiveShadow
                scale={[0, 0, 0]} // CRITICAL: Initialize at 0 to prevent 1-frame glitch
                visible={false}
            >
                <boxGeometry args={[0.5, 0.5, 0.5]} />

                {/* Optimized Standard Material (No Refraction) */}
                <meshStandardMaterial
                    color="#ffffff"
                    transparent={true}
                    opacity={0.3}         // Simple transparency
                    roughness={0.1}       // Smooth surface
                    metalness={0.1}       // Slight metallic tint for reflection
                    side={THREE.DoubleSide}
                />

                {/* Subtle internal glow - very weak to just define the shape */}
                <pointLight intensity={0.5} distance={1} color="#ffffff" />
            </mesh>
        </group>
    );
}
