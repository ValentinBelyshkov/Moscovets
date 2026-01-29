import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "./Layout";
import { ModelViewer } from "./ModelViewer";
import { MapViewer } from "./MapViewer";
import { ConfigPanel } from "./ConfigPanel";
import { biometryApi } from "../services/biometryApi";
import { getApiBaseUrl } from "../config/api";
import type { MapPoint, ModelPoint, Pair, StatusResponse } from "../types";

const apiBase = getApiBaseUrl();

function BiometryApp() {
  const [modelUrl, setModelUrl] = useState<string>();
  const [modelPoints, setModelPoints] = useState<ModelPoint[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [status, setStatus] = useState<StatusResponse>();

  const [placingModelPoint, setPlacingModelPoint] = useState(false);
  const [placingMapPoint, setPlacingMapPoint] = useState(false);

  const refreshModelPoints = useCallback(async () => {
    const data = await biometryApi.getModelPoints();
    setModelPoints(data);
  }, []);

  const refreshMapPoints = useCallback(async () => {
    const data = await biometryApi.getMapPoints();
    setMapPoints(data);
  }, []);

  const refreshPairs = useCallback(async () => {
    const data = await biometryApi.getPairs();
    setPairs(data);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await biometryApi.status();
      setStatus(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshModelPoints(), refreshMapPoints(), refreshPairs(), refreshStatus()]);
  }, [refreshModelPoints, refreshMapPoints, refreshPairs, refreshStatus]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (status?.model_path) {
      setModelUrl(new URL(status.model_path, apiBase).toString());
    }
  }, [status]);

  const handleUpload = useCallback(
    async (file: File) => {
      const result = await biometryApi.uploadObj(file);
      const absoluteUrl = new URL(result.stored_path, apiBase).toString();
      setModelUrl(absoluteUrl);
      await refreshStatus();
    },
    [refreshStatus],
  );

  const handleAddModelPoint = useCallback(
    async (coords: { x: number; y: number; z: number }) => {
      await biometryApi.addModelPoint(coords);
      await refreshModelPoints();
    },
    [refreshModelPoints],
  );

  const handleAddMapPoint = useCallback(
    async (coords: { lat: number; lng: number }) => {
      await biometryApi.addMapPoint(coords);
      await refreshMapPoints();
    },
    [refreshMapPoints],
  );

  const handleLink = useCallback(
    async (payload: { model_id: number; map_id: number }) => {
      await biometryApi.addPair(payload);
      await Promise.all([refreshPairs(), refreshStatus()]);
    },
    [refreshPairs, refreshStatus],
  );

  const handleDeletePair = useCallback(
    async (pairId: number) => {
      await biometryApi.deletePair(pairId);
      await Promise.all([refreshPairs(), refreshStatus()]);
    },
    [refreshPairs, refreshStatus],
  );

  const handleExport = useCallback(async () => {
    const blob = await biometryApi.exportConfig();
    return blob;
  }, []);

  const handleClear = useCallback(async () => {
    await biometryApi.clearPoints();
    setPairs([]);
    setModelPoints([]);
    setMapPoints([]);
    await refreshStatus();
  }, [refreshStatus]);

  const layoutLeft = useMemo(
    () => (
      <ConfigPanel
        modelPoints={modelPoints}
        mapPoints={mapPoints}
        pairs={pairs}
        status={status}
        onLink={handleLink}
        onDeletePair={handleDeletePair}
        onExport={handleExport}
        onClear={handleClear}
      />
    ),
    [modelPoints, mapPoints, pairs, status, handleLink, handleDeletePair, handleExport, handleClear],
  );

  const layoutCenter = useMemo(
    () => (
      <ModelViewer
        modelUrl={modelUrl}
        modelPoints={modelPoints}
        placing={placingModelPoint}
        onTogglePlacing={() => setPlacingModelPoint((prev) => !prev)}
        onAddPoint={handleAddModelPoint}
        onUpload={handleUpload}
      />
    ),
    [modelUrl, modelPoints, placingModelPoint, handleAddModelPoint, handleUpload],
  );

  const layoutRight = useMemo(
    () => (
      <MapViewer
        points={mapPoints}
        placing={placingMapPoint}
        onTogglePlacing={() => setPlacingMapPoint((prev) => !prev)}
        onAddPoint={handleAddMapPoint}
      />
    ),
    [mapPoints, placingMapPoint, handleAddMapPoint],
  );

  return <Layout left={layoutLeft} center={layoutCenter} right={layoutRight} />;
}

export default BiometryApp;