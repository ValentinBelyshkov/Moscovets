import axios from "axios";
import type { MapPoint, ModelPoint, ObjUploadResponse, Pair, StatusResponse } from "../types";
import { getApiBaseUrl } from "../config/api";

const client = axios.create({
  baseURL: getApiBaseUrl(),
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