import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useCursor } from '@react-three/drei'
import * as THREE from 'three'

export function FloorButton({ isNight, toggleTheme }: { isNight: boolean; toggleTheme?: () => void }) {
    const group = useRef<THREE.Group>(null)
    const buttonMesh = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [navigating, setNavigating] = useState(false) // Lock animation state

    useCursor(hovered)

    // Animation constants - Calibrated for new height (0.4)
    // Deep press target: -0.5 (Flush with base top: 1.0 - 1.5 = -0.5)
    // If navigating, KEEP it pressed (-0.5)
    const targetY = (pressed || navigating) ? -0.6 : (hovered ? 0.6 : 0.6)
    const targetScale = (pressed || navigating) ? 0.98 : (hovered ? 1.02 : 1)

    useFrame((state, delta) => {
        if (buttonMesh.current) {
            buttonMesh.current.position.y = THREE.MathUtils.lerp(
                buttonMesh.current.position.y,
                targetY,
                delta * 4
            )

            const s = THREE.MathUtils.lerp(buttonMesh.current.scale.x, targetScale, delta * 20)
            buttonMesh.current.scale.set(s, s, s)
        }
    })

    const handleClick = () => {
        setNavigating(true) // Lock the animation in "pressed" state
        setPressed(true)
        setTimeout(() => {
            if (toggleTheme) toggleTheme()
            setNavigating(false)
            setPressed(false)
        }, 300) // 300ms delay for feel
    }

    // Colors - Dynamic based on theme
    const baseColor = new THREE.Color('#000000') // Pure Black
    // Day: Vivid Warm Brown, Night: Deep Bordeaux (User Request). 
    // Using a darker red to avoid pinkish look when emissive.
    const activeColor = new THREE.Color(isNight ? '#5C0000' : '#632800')

    return (
        <group
            ref={group}
            position={[0, 0, 7]}
            rotation={[0, 0, 0]}
        >
            {/* Base Ring - Matte & Solid */}
            <mesh position={[0, 0, 0]} receiveShadow>
                <cylinderGeometry args={[1.3, 1.3, 2, 100]} />
                <meshStandardMaterial
                    color={baseColor}
                    roughness={0.2}
                    metalness={0.3}
                />
            </mesh>

            {/* Main Button - Soft Matte Plastic (No Reflection) */}
            <mesh
                ref={buttonMesh}
                position={[0, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => {
                    if (!navigating) {
                        setHovered(false)
                        setPressed(false)
                    }
                }}
                onPointerDown={() => setPressed(true)}
                onPointerUp={() => {
                    if (!navigating) setPressed(false)
                }}
                receiveShadow
                castShadow
            >
                {/* Main Body - Higher Poly */}
                <cylinderGeometry args={[1.05, 1.05, 3, 64]} />
                <meshStandardMaterial // Changed from Physical to Standard
                    color={activeColor}
                    emissive={activeColor}
                    // Reduced intensity to prevent "pink" washout. 
                    // Night mode needs lower emissive for dark red.
                    emissiveIntensity={hovered ? 0.6 : (isNight ? 0.3 : 1)}
                    roughness={0.4}
                    metalness={0.7}
                    toneMapped={false}
                />

                {/* Refined Rounded Top Cap */}
                {/* Sunk slightly (y=1.35) and smoothed (64 segments) for seamless blend */}
                <mesh position={[0, 1.35, 0]} scale={[1, 0.4, 1]}>
                    <sphereGeometry args={[1.05, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial
                        color={activeColor}
                        emissive={activeColor}
                        emissiveIntensity={hovered ? 0.6 : (isNight ? 0.3 : 1)}
                        roughness={0.4}
                        metalness={0.7}
                        toneMapped={false}
                    />
                </mesh>
            </mesh>

            {/* Label - Updated context */}
            <Text
                position={[0, 0, 2]}
                rotation={[-1.5, 0, 0]}
                fontSize={0.3}
                color={isNight ? "#ffffff" : "#1a1a1a"}
                anchorX="center"
                anchorY="middle"
                maxWidth={3}
                fillOpacity={0.8}
                letterSpacing={0.1}
            >
                {isNight ? "TURN ON LIGHTS" : "TURN OFF LIGHTS"}
            </Text>

            {/* Soft Fill Light for Button Face */}

        </group>
    )
}
