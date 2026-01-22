import { useMemo, useState } from "react";
import type { MapPoint, ModelPoint, Pair, StatusResponse } from "../types";

interface ConfigPanelProps {
  modelPoints: ModelPoint[];
  mapPoints: MapPoint[];
  pairs: Pair[];
  status?: StatusResponse;
  onLink: (payload: { model_id: number; map_id: number }) => Promise<void>;
  onDeletePair: (pairId: number) => Promise<void>;
  onExport: () => Promise<void>;
  onClear: () => Promise<void>;
}

export function ConfigPanel({
  modelPoints,
  mapPoints,
  pairs,
  status,
  onLink,
  onDeletePair,
  onExport,
  onClear,
}: ConfigPanelProps) {
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedMapId, setSelectedMapId] = useState<number>();
  const [busy, setBusy] = useState(false);

  const statusClass =
    status?.status === "ready"
      ? "status-pill status-ready"
      : status?.status === "no-model"
        ? "status-pill status-error"
        : "status-pill status-warning";

  const pairDisplay = useMemo(() => {
    return pairs.map((pair) => ({
      pair,
      model: modelPoints.find((point) => point.id === pair.model_id),
      map: mapPoints.find((point) => point.id === pair.map_id),
    }));
  }, [pairs, modelPoints, mapPoints]);

  const handleLink = async () => {
    if (!selectedModelId || !selectedMapId) return;
    setBusy(true);
    try {
      await onLink({ model_id: selectedModelId, map_id: selectedMapId });
      setSelectedMapId(undefined);
      setSelectedModelId(undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const response = await onExport();
      const blob = response;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "calibration.json";
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await onClear();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="control-row" style={{ justifyContent: "space-between" }}>
        <strong>Конфигурация</strong>
        {status && (
          <span className={statusClass}>
            {status.status.toUpperCase()} {status.details ? `· ${status.details}` : ""}
          </span>
        )}
      </div>
      <div className="control-row">
        <select
          value={selectedModelId ?? ""}
          onChange={(event) => setSelectedModelId(event.target.value ? Number(event.target.value) : undefined)}
        >
          <option value="">Точка 3D</option>
          {modelPoints.map((point) => (
            <option key={point.id} value={point.id}>
              #{point.id}: {point.x.toFixed(2)}, {point.y.toFixed(2)}, {point.z.toFixed(2)}
            </option>
          ))}
        </select>
        <select
          value={selectedMapId ?? ""}
          onChange={(event) => setSelectedMapId(event.target.value ? Number(event.target.value) : undefined)}
        >
          <option value="">Точка карты</option>
          {mapPoints.map((point) => (
            <option key={point.id} value={point.id}>
              #{point.id}: {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </option>
          ))}
        </select>
        <button onClick={handleLink} disabled={busy || !selectedMapId || !selectedModelId}>
          Связать
        </button>
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>3D точка</th>
              <th>Гео точка</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pairDisplay.map(({ pair, model, map }) => (
              <tr key={pair.id}>
                <td>#{pair.id}</td>
                <td>
                  {model
                    ? `${model.x.toFixed(2)}, ${model.y.toFixed(2)}, ${model.z.toFixed(2)}`
                    : "—"}
                </td>
                <td>{map ? `${map.lat.toFixed(4)}, ${map.lng.toFixed(4)}` : "—"}</td>
                <td>
                  <button className="secondary" onClick={() => onDeletePair(pair.id)} disabled={busy}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {!pairs.length && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "12px" }}>
                  Нет связей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="control-row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <button className="secondary" onClick={handleClear} disabled={busy}>
          Очистить все точки
        </button>
        <button onClick={handleExport} disabled={busy || !pairs.length}>
          Экспорт
        </button>
      </div>
    </div>
  );
}