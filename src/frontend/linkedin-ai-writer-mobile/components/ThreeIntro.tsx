import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { View } from 'react-native';

function SpinningCube() {
  const meshRef = useRef<any>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'#0077b5'} />
    </mesh>
  );
}

export default function ThreeIntro() {
  return (
    <View style={{ width: 300, height: 300, alignSelf: 'center' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <SpinningCube />
      </Canvas>
    </View>
  );
}
