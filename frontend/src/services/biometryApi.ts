import axios from "axios";
import type { MapPoint, ModelPoint, ObjUploadResponse, Pair, StatusResponse } from "../types";

// Define the API base URL using the environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_.REACT_APP_URL_API) {
    return (window as any)._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || "http://109.196.102.193:5001";
};

const apiBase = getApiBaseUrl();

const client = axios.create({
  baseURL: apiBase,
});

export const biometryApi = {
  uploadObj(file: File) {
    const data = new FormData();
    data.append("file", file);
    return client.post<ObjUploadResponse>("/biometry/upload-obj", data).then((res) => res.data);
  },
  getModelPoints() {
    return client.get<ModelPoint[]>("/biometry/model-points").then((res) => res.data);
  },
  addModelPoint(point: Omit<ModelPoint, "id">) {
    return client.post<ModelPoint>("/biometry/add-model-point", point).then((res) => res.data);
  },
  getMapPoints() {
    return client.get<MapPoint[]>("/biometry/map-points").then((res) => res.data);
  },
  addMapPoint(point: Omit<MapPoint, "id">) {
    return client.post<MapPoint>("/biometry/add-map-point", point).then((res) => res.data);
  },
  getPairs() {
    return client.get<Pair[]>("/biometry/pairs").then((res) => res.data);
  },
  addPair(payload: { model_id: number; map_id: number }) {
    return client.post<Pair>("/biometry/pairs", payload).then((res) => res.data);
  },
  deletePair(pairId: number) {
    return client.delete(`/biometry/pairs/${pairId}`);
  },
  clearPoints() {
    return client.delete("/biometry/clear-points");
  },
  exportConfig() {
    return client.post<Blob>("/biometry/export-config", undefined, {
      responseType: "blob",
    }).then((res) => res.data);
  },
  status() {
    return client.get<StatusResponse>("/biometry/status").then((res) => res.data);
  },
};