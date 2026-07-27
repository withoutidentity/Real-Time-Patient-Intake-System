import { createServer } from "http";
import { Server } from "socket.io";
import {
  type FieldStatus,
  type PatientData,
  type PatientField,
  type PatientSnapshot,
  patientStatusPayloadSchema,
  patientSubmitPayloadSchema,
  patientUpdatePayloadSchema,
  sessionIdSchema
} from "@/lib/schema";
import { sanitizeDeep, stripHtml } from "@/lib/sanitize";

const port = Number(process.env.SOCKET_PORT ?? 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
const staffSocketToken = process.env.STAFF_SOCKET_TOKEN;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? frontendOrigin : [frontendOrigin, "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

const sessions = new Map<string, PatientSnapshot>();
const lastUpdateBySocket = new Map<string, number>();

function now() {
  return new Date().toISOString();
}

function getSnapshot(sessionId: string) {
  const existing = sessions.get(sessionId);

  if (existing) {
    return existing;
  }

  const snapshot: PatientSnapshot = {
    sessionId,
    data: {},
    status: "inactive",
    updatedAt: now()
  };

  sessions.set(sessionId, snapshot);
  return snapshot;
}

function setField(data: Partial<PatientData>, field: PatientField, value: string) {
  if (field === "emergencyContact.name" || field === "emergencyContact.relationship") {
    data.emergencyContact = {
      ...data.emergencyContact,
      [field.split(".")[1]]: value
    };
    return;
  }

  (data as Record<string, unknown>)[field] = value;
}

function updateStatus(sessionId: string, status: FieldStatus) {
  const snapshot = getSnapshot(sessionId);
  snapshot.status = status;
  snapshot.updatedAt = now();
  sessions.set(sessionId, snapshot);
  io.to(sessionId).emit("patient:status", { sessionId, status });
  io.to("staff").emit("patient:snapshot", snapshot);
}

io.on("connection", (socket) => {
  socket.on("patient:join", (payload: unknown) => {
    const parsed = sessionIdSchema.safeParse((payload as { sessionId?: unknown })?.sessionId);

    if (!parsed.success) {
      return;
    }

    const snapshot = getSnapshot(parsed.data);
    socket.join(parsed.data);
    socket.emit("patient:snapshot", snapshot);
    io.to("staff").emit("patient:snapshot", snapshot);
  });

  socket.on("staff:join", (payload: unknown) => {
    const token = (payload as { token?: string } | undefined)?.token;

    if (staffSocketToken && token !== staffSocketToken) {
      socket.emit("staff:error", { message: "Unauthorized" });
      return;
    }

    socket.join("staff");
    socket.emit("patient:list", Array.from(sessions.values()));
  });

  socket.on("patient:update", (payload: unknown) => {
    const currentTime = Date.now();
    const lastUpdate = lastUpdateBySocket.get(socket.id) ?? 0;

    if (currentTime - lastUpdate < 150) {
      return;
    }

    lastUpdateBySocket.set(socket.id, currentTime);

    const parsed = patientUpdatePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return;
    }

    const safeValue = stripHtml(parsed.data.value);
    const snapshot = getSnapshot(parsed.data.sessionId);
    setField(snapshot.data, parsed.data.field, safeValue);
    snapshot.status = "filling";
    snapshot.updatedAt = now();
    sessions.set(parsed.data.sessionId, snapshot);

    const safePayload = {
      ...parsed.data,
      value: safeValue
    };

    socket.to(parsed.data.sessionId).emit("patient:update", safePayload);
    io.to("staff").emit("patient:snapshot", snapshot);
  });

  socket.on("patient:status", (payload: unknown) => {
    const parsed = patientStatusPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return;
    }

    updateStatus(parsed.data.sessionId, parsed.data.status);
  });

  socket.on("patient:submitted", (payload: unknown) => {
    const parsed = patientSubmitPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return;
    }

    const snapshot = getSnapshot(parsed.data.sessionId);
    snapshot.data = sanitizeDeep(parsed.data.data);
    snapshot.status = "submitted";
    snapshot.updatedAt = now();
    sessions.set(parsed.data.sessionId, snapshot);

    io.to(parsed.data.sessionId).emit("patient:status", {
      sessionId: parsed.data.sessionId,
      status: "submitted"
    });
    io.to("staff").emit("patient:snapshot", snapshot);
  });

  socket.on("disconnect", () => {
    lastUpdateBySocket.delete(socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Socket.IO server listening on http://localhost:${port}`);
});
