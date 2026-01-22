import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function BackgroundSphere({ scrollY }) {
  const mesh = useRef();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y = scrollY.current * 0.0004;
      mesh.current.rotation.x = scrollY.current * 0.0002;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -30]} scale={18}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#6366f1"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

export default function FloatingBackground({ scrollY }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 75 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />
      <BackgroundSphere scrollY={scrollY} />
    </Canvas>
  );
}
