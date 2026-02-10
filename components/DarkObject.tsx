import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";

export function DarkObject() {
    const { scene } = useGLTF("/darks.glb");
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    const { size } = useThree();
    const isMobile = size.width < 768;

    // Responsive Position:
    // Desktop: Left side (-6)
    // Mobile: Slightly Left (-2) - User Request: "biraz sol"
    const position = useMemo(() => isMobile ? [-2, 2.3, -3.5] : [-6, 2.3, -3.5], [isMobile]);

    return (
        <primitive
            object={clonedScene}
            position={position}
            scale={[5, 5, 5]}
            rotation={[0, 1.6, 0]}
        />
    );
}

useGLTF.preload("/darks.glb");
