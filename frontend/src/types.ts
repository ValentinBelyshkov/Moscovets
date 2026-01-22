export interface ObjUploadResponse {
  filename: string;
  content_type: string;
  size_bytes: number;
  stored_path: string;
  uploaded_at: string;
}

export interface ModelPoint {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface MapPoint {
  id: number;
  lat: number;
  lng: number;
}

export interface Pair {
  id: number;
  model_id: number;
  map_id: number;
}

export interface CalibrationPoint {
  model_point: ModelPoint;
  geo_point: MapPoint;
}

export interface CalibrationExport {
  version: string;
  model_path: string;
  pairs: CalibrationPoint[];
}

export interface StatusResponse {
  status: "ready" | "no-model" | "no-pairs" | string;
  details?: string;
  model_path?: string;
}

export interface CreateModelPoint {
  x: number;
  y: number;
  z: number;
}

export interface CreateMapPoint {
  lat: number;
  lng: number;
}

export interface CreatePair {
  model_id: number;
  map_id: number;
}