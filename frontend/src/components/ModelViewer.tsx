import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, ThreeEvent, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import type { ModelPoint } from "../types";

interface ModelViewerProps {
  modelUrl?: string;
  modelPoints: ModelPoint[];
  placing: boolean;
  onTogglePlacing: () => void;
  onAddPoint: (point: { x: number; y: number; z: number }) => void;
  onUpload: (file: File) => Promise<void>;
}

function ModelMesh({
  url,
  onPointerDown,
}: {
  url: string;
  onPointerDown: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const object = useLoader(OBJLoader, url);
  const cloned = useMemo(() => object.clone(), [object]);
  return <primitive object={cloned} onPointerDown={onPointerDown} />;
}

function Marker({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.05, 32, 32]} />
      <meshBasicMaterial color="#f8fafc" />
      <meshStandardMaterial color="#111827" wireframe />
    </mesh>
  );
}

export function ModelViewer({
  modelUrl,
  modelPoints,
  placing,
  onTogglePlacing,
  onAddPoint,
  onUpload,
}: ModelViewerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    setLoading(true);
    try {
      await onUpload(file);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    if (!placing) return;
    event.stopPropagation();
    const { x, y, z } = event.point;
    onAddPoint({ x, y, z });
    onTogglePlacing();
  };

  return (
    <>
      <div className="control-row">
        <button className="secondary" onClick={() => fileRef.current?.click()}>
          Загрузить .obj
        </button>
        <input
          type="file"
          accept=".obj"
          style={{ display: "none" }}
          ref={fileRef}
          onChange={handleFileChange}
        />
        <button onClick={onTogglePlacing} disabled={!modelUrl}>
          {placing ? "Выберите точку..." : "Поставить точку"}
        </button>
      </div>
      {!modelUrl && (
        <p>
          Загрузите модель в формате OBJ, чтобы начать. Поддерживается вращение, зум и выбор точек.
        </p>
      )}
      <div style={{ flex: 1, minHeight: "0", position: "relative" }}>
        <Canvas camera={{ position: [0, 2, 4], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 5]} intensity={1.2} />
          {modelUrl && (
            <Suspense fallback={null}>
              <ModelMesh url={modelUrl} onPointerDown={handlePointerDown} />
            </Suspense>
          )}
          {modelPoints.map((point) => (
            <Marker key={point.id} position={[point.x, point.y, point.z]} />
          ))}
          <gridHelper args={[10, 10]} />
          <OrbitControls />
        </Canvas>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.8)",
            }}
          >
            Загружается...
          </div>
        )}
      </div>
    </>
  );
}