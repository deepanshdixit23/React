import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Box() {
  return (
    <mesh rotation={[1, 1, 0]}>
      <boxGeometry />
      <meshStandardMaterial color="#6c63ff" />
    </mesh>
  );
}

export default function FloatingShapes() {
  return (
    <Canvas style={{ height: 200 }}>
      <ambientLight />
      <Box />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
