import { useMemo } from "react";
import { Map, Placemark, YMaps, ZoomControl } from "@pbe/react-yandex-maps";
import type { MapPoint } from "../types";

interface MapViewerProps {
  points: MapPoint[];
  placing: boolean;
  onTogglePlacing: () => void;
  onAddPoint: (point: { lat: number; lng: number }) => void;
}

const defaultView = {
  center: [55.7558, 37.6176] as [number, number],
  zoom: 4,
};

type MapClickEvent = {
  get: (key: "coords") => [number, number];
};

export function MapViewer({ points, placing, onTogglePlacing, onAddPoint }: MapViewerProps) {
  const yandexApiKey = useMemo(() => import.meta.env.VITE_YMAPS_API_KEY || "", []);

  const handleMapClick = (event: MapClickEvent) => {
    if (!placing) return;
    const coords = event.get("coords");
    if (!coords) return;
    const [lat, lng] = coords;
    onAddPoint({ lat, lng });
    onTogglePlacing();
  };

  return (
    <>
      <div className="control-row">
        <button
          onClick={onTogglePlacing}
          aria-pressed={placing}
          aria-label="Добавить точку на карте"
        >
          {placing ? "Выберите точку..." : "Поставить точку на карте"}
        </button>
        {!yandexApiKey && (
          <span>Вы можете указать API-ключ Яндекс.Карт через VITE_YMAPS_API_KEY</span>
        )}
      </div>
      <div className="map-container">
        <YMaps
          query={
            yandexApiKey
              ? {
                  apikey: yandexApiKey,
                }
              : undefined
          }
        >
          <Map
            width="100%"
            height="100%"
            defaultState={{
              center: defaultView.center,
              zoom: defaultView.zoom,
            }}
            options={{
              suppressMapOpenBlock: true,
            }}
            onClick={handleMapClick}
          >
            <ZoomControl options={{ position: { top: 16, left: 16 } }} />
            {points.map((point) => (
              <Placemark
                key={point.id}
                geometry={[point.lat, point.lng]}
                options={{
                  preset: "islands#circleIcon",
                  iconColor: "#0f172a",
                }}
              />
            ))}
          </Map>
        </YMaps>
      </div>
    </>
  );
}