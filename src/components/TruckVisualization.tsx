import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
import { Box as BoxType } from '@/data/dummyData';
import * as THREE from 'three';

interface TruckDimensions {
  length: number;
  width: number;
  height: number;
}

interface TruckVisualizationProps {
  boxes: BoxType[];
  truckDimensions: TruckDimensions;
}

const TruckBox = ({ box, truckDimensions }: { box: BoxType; truckDimensions: TruckDimensions }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const wallThickness = 0.005; // Even thinner wall thickness
  const halfWallThickness = wallThickness / 2;

  // Calculate scale factor for overall scene scaling
  const scale = useMemo(() => {
    const maxDimension = Math.max(
      truckDimensions.length,
      truckDimensions.width,
      truckDimensions.height
    );
    return 0.8 / maxDimension; // Consistent scene scale
  }, [truckDimensions]);

  // Padding factor for visual spacing of boxes
  const paddingFactor = 0.97; // Subtle padding

  // Calculate box dimensions in scaled units with padding
  const boxDimensions = useMemo(() => ({
    length: box.dimensions.length * scale * paddingFactor,
    width: box.dimensions.width * scale * paddingFactor,
    height: box.dimensions.height * scale * paddingFactor
  }), [box.dimensions, scale, paddingFactor]);

  // Calculate scaled truck dimensions (used for interior bounds and offsetting)
  const scaledTruckLength = truckDimensions.length * scale;
  const scaledTruckWidth = truckDimensions.width * scale;
  const scaledTruckHeight = truckDimensions.height * scale;

  // Corrected position calculation for the box's center in the 3D scene
  // box.position.x, y, z from boxStacking.ts are bottom-left-front corner of box,
  // relative to truck's bottom-left-front corner (0,0,0) in the conceptual space.
  //
  // In Three.js, the TruckFrame is centered at (0,0,0).
  // The actual inner usable space for placing boxes (bottom-left-front corner) is at:
  // x: -scaledTruckLength/2 + halfWallThickness
  // y: 0 (floor)
  // z: -scaledTruckWidth/2 + halfWallThickness
  const position = useMemo(() => {
    // Calculate the Three.js scene coordinates for the truck's inner bottom-left-front corner
    const truckInnerSceneStartX = -scaledTruckLength / 2 + halfWallThickness;
    const truckInnerSceneStartY = 0; // Floor is at Y=0
    const truckInnerSceneStartZ = -scaledTruckWidth / 2 + halfWallThickness;

    // Translate the box's position (from boxStacking) to Three.js scene coordinates
    // This gives us the box's *scaled* bottom-left-front corner in the Three.js scene
    const boxSceneStartX = truckInnerSceneStartX + (box.position.x * scale);
    const boxSceneStartY = truckInnerSceneStartY + (box.position.y * scale);
    const boxSceneStartZ = truckInnerSceneStartZ + (box.position.z * scale);

    // Now, add half of the box's *rendered* dimension to get its center for Three.js mesh position
    const x = boxSceneStartX + (boxDimensions.length / 2);
    const y = boxSceneStartY + (boxDimensions.height / 2);
    const z = boxSceneStartZ + (boxDimensions.width / 2);

    // Console logs for debugging (can remove after verification)
    // console.log(`Box ${box.id} - Stacked Pos (x,y,z): ${box.position.x}, ${box.position.y}, ${box.position.z}`);
    // console.log(`Box ${box.id} - Rendered Pos (x,y,z): ${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`);
    // console.log(`Box ${box.id} - Rendered Dim (L,H,W): ${boxDimensions.length.toFixed(3)}, ${boxDimensions.height.toFixed(3)}, ${boxDimensions.width.toFixed(3)}`);
    // console.log(`Truck scaled inner (x,y,z): ${truckInnerSceneStartX.toFixed(3)}, ${truckInnerSceneStartY.toFixed(3)}, ${truckInnerSceneStartZ.toFixed(3)}`);

    return [x, y, z];
  }, [box.position, box.dimensions, truckDimensions, scale, paddingFactor, halfWallThickness]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[boxDimensions.length, boxDimensions.height, boxDimensions.width]} />
      <meshStandardMaterial 
        color={box.isFragile ? "#ef4444" : "#3b82f6"} 
        transparent 
        opacity={0.8}
      />
    </mesh>
  );
};

const TruckFrame = ({ dimensions }: { dimensions: TruckDimensions }) => {
  const scale = useMemo(() => {
    const maxDimension = Math.max(
      dimensions.length,
      dimensions.width,
      dimensions.height
    );
    return 0.8 / maxDimension; // Match the box scale factor
  }, [dimensions]);

  const scaledDimensions = useMemo(() => ({
    length: dimensions.length * scale,
    width: dimensions.width * scale,
    height: dimensions.height * scale
  }), [dimensions, scale]);

  const wallThickness = 0.005; // Thickness of the walls - even thinner
  const halfWallThickness = wallThickness / 2;

  return (
    <group>
      {/* Floor - place its center at (0,0,0) and rotate to be horizontal */}
      <mesh 
        position={[0, 0, 0]} // Floor surface at y=0
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[scaledDimensions.length, scaledDimensions.width]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Walls - position their center at half of their height, so they sit on the floor (y=0) */}
      {/* Back Wall (-Z) */}
      <mesh 
        position={[0, scaledDimensions.height / 2, -scaledDimensions.width / 2 + halfWallThickness]} 
        receiveShadow
      >
        <boxGeometry args={[scaledDimensions.length, scaledDimensions.height, wallThickness]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.5} />
      </mesh>

      {/* Front Wall (+Z) */}
      <mesh 
        position={[0, scaledDimensions.height / 2, scaledDimensions.width / 2 - halfWallThickness]} 
        receiveShadow
      >
        <boxGeometry args={[scaledDimensions.length, scaledDimensions.height, wallThickness]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.5} />
      </mesh>

      {/* Left Wall (-X) */}
      <mesh 
        position={[-scaledDimensions.length / 2 + halfWallThickness, scaledDimensions.height / 2, 0]} 
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[scaledDimensions.width, scaledDimensions.height, wallThickness]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.5} />
      </mesh>

      {/* Right Wall (+X) */}
      <mesh 
        position={[scaledDimensions.length / 2 - halfWallThickness, scaledDimensions.height / 2, 0]} 
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[scaledDimensions.width, scaledDimensions.height, wallThickness]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const Scene = ({ boxes, truckDimensions }: TruckVisualizationProps) => {
  const { camera } = useThree();

  // Set up camera position based on truck dimensions
  useMemo(() => {
    const maxDimension = Math.max(
      truckDimensions.length,
      truckDimensions.width,
      truckDimensions.height
    );
    const scale = 0.8 / maxDimension; // Ensure camera scaling matches object scaling
    const distance = Math.max(truckDimensions.length, truckDimensions.width, truckDimensions.height) * scale * 1.5; // Adjust camera distance dynamically
    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
  }, [camera, truckDimensions]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <TruckFrame dimensions={truckDimensions} />
      {boxes.map((box) => (
        <TruckBox key={box.id} box={box} truckDimensions={truckDimensions} />
      ))}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={1}
      />
    </>
  );
};

const TruckVisualization = (props: TruckVisualizationProps) => {
  return (
    <Canvas shadows camera={{ position: [2, 2, 2], fov: 50 }}>
      <Scene {...props} />
    </Canvas>
  );
};

export default TruckVisualization;
