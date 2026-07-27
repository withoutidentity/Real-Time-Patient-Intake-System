"use client";

import { io, type Socket } from "socket.io-client";
import type {
  FieldStatus,
  PatientSnapshot,
  PatientStatusPayload,
  PatientSubmitPayload,
  PatientUpdatePayload
} from "@/lib/schema";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? "http://localhost:3001", {
      autoConnect: true,
      transports: ["websocket", "polling"]
    });
  }

  return socket;
}

export function joinPatientSession(sessionId: string) {
  getSocket().emit("patient:join", { sessionId });
}

export function joinStaffDashboard(token?: string) {
  getSocket().emit("staff:join", { token });
}

export function emitPatientUpdate(payload: PatientUpdatePayload) {
  getSocket().emit("patient:update", payload);
}

export function emitPatientStatus(payload: PatientStatusPayload) {
  getSocket().emit("patient:status", payload);
}

export function emitPatientSubmitted(payload: PatientSubmitPayload) {
  getSocket().emit("patient:submitted", payload);
}

export function onPatientUpdate(handler: (payload: PatientUpdatePayload) => void) {
  getSocket().on("patient:update", handler);
  return () => getSocket().off("patient:update", handler);
}

export function onPatientStatus(handler: (payload: { sessionId: string; status: FieldStatus }) => void) {
  getSocket().on("patient:status", handler);
  return () => getSocket().off("patient:status", handler);
}

export function onPatientSnapshot(handler: (snapshot: PatientSnapshot) => void) {
  getSocket().on("patient:snapshot", handler);
  return () => getSocket().off("patient:snapshot", handler);
}

export function onPatientList(handler: (snapshots: PatientSnapshot[]) => void) {
  getSocket().on("patient:list", handler);
  return () => getSocket().off("patient:list", handler);
}
