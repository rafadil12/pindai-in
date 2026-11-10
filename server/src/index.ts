import http from "node:http";
import os from "node:os";
import { randomBytes } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import type { Row, ServerMessage } from "../../shared/types.ts";

const PORT = Number(process.env.PORT ?? 8787);
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_TEXT = 500;
const MAX_ROWS = 1000;

type Role = "receiver" | "sender";

type Session = {
  code: string;
  createdAt: string;
  rows: Row[];
  expired: boolean;
  receivers: Set<WebSocket>;
  senders: Set<WebSocket>;
};

const sessions = new Map<string, Session>();

function makeCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return sessions.has(code) ? makeCode() : code;
}

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(session: Session, message: ServerMessage) {
  for (const ws of [...session.receivers, ...session.senders]) {
    send(ws, message);
  }
}

function sendThenClose(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState !== WebSocket.OPEN) {
    ws.close();
    return;
  }
  ws.send(JSON.stringify(message), () => ws.close());
}

function expireSession(session: Session) {
  if (session.expired) return;
  session.expired = true;
  const sockets = [...session.receivers, ...session.senders];
  session.receivers.clear();
  session.senders.clear();
  for (const ws of sockets) sendThenClose(ws, { type: "expired" });
}

function presence(session: Session): ServerMessage {
  return {
    type: "presence",
    receivers: session.receivers.size,
    senders: session.senders.size,
  };
}

function state(session: Session): ServerMessage {
  return {
    type: "state",
    code: session.code,
    createdAt: session.createdAt,
    rows: session.rows,
    receivers: session.receivers.size,
    senders: session.senders.size,
  };
}

function lanAddresses(): string[] {
  const found: string[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      const v4 = net.family === "IPv4" || (net.family as unknown) === 4;
      if (!v4 || net.internal || net.address.startsWith("169.254.")) continue;
      found.push(net.address);
    }
  }
  return found.sort((a, b) => rank(a) - rank(b));
}

function rank(ip: string): number {
  if (ip.startsWith("192.168.")) return 0;
  if (ip.startsWith("10.")) return 1;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return 2;
  return 3;
}

function json(res: http.ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "POST" && url.pathname === "/api/sessions") {
    const session: Session = {
      code: makeCode(),
      createdAt: new Date().toISOString(),
      rows: [],
      expired: false,
      receivers: new Set(),
      senders: new Set(),
    };
    sessions.set(session.code, session);
    json(res, 201, { code: session.code, createdAt: session.createdAt });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/network") {
    json(res, 200, { addresses: lanAddresses() });
    return;
  }

  const expireMatch = url.pathname.match(/^\/api\/sessions\/([A-Z2-9]{6})\/expire$/);
  if (req.method === "POST" && expireMatch) {
    const session = sessions.get(expireMatch[1]);
    if (!session) {
      json(res, 404, { error: "Sesi tidak ditemukan" });
      return;
    }
    expireSession(session);
    json(res, 200, { code: session.code, expired: true });
    return;
  }

  const match = url.pathname.match(/^\/api\/sessions\/([A-Z2-9]{6})$/);
  if (req.method === "GET" && match) {
    const session = sessions.get(match[1]);
    if (!session) {
      json(res, 404, { error: "Sesi tidak ditemukan" });
      return;
    }
    if (session.expired) {
      json(res, 410, { error: "Sesi ditutup", expired: true });
      return;
    }
    json(res, 200, {
      code: session.code,
      createdAt: session.createdAt,
      rows: session.rows,
      receivers: session.receivers.size,
      senders: session.senders.size,
    });
    return;
  }

  json(res, 404, { error: "Tidak ditemukan" });
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const role = url.searchParams.get("role");
  const code = (url.searchParams.get("code") ?? "").toUpperCase();
  const session = sessions.get(code);

  if ((role !== "receiver" && role !== "sender") || !session) {
    send(ws, { type: "error", message: "Sesi atau peran tidak valid" });
    ws.close();
    return;
  }

  if (session.expired) {
    sendThenClose(ws, { type: "expired" });
    return;
  }

  const bucket = role === "receiver" ? session.receivers : session.senders;
  bucket.add(ws);
  send(ws, state(session));
  broadcast(session, presence(session));

  ws.on("message", (data) => {
    const raw = data.toString();
    if (raw.length > 8000 || role !== "sender") return;

    let message: { type?: string; id?: string; text?: string };
    try {
      message = JSON.parse(raw) as { type?: string; id?: string; text?: string };
    } catch {
      return;
    }
    if (message.type !== "submit") return;
    if (session.expired) {
      send(ws, { type: "expired" });
      return;
    }

    const id = (message.id ?? "").trim();
    const text = (message.text ?? "").trim().slice(0, MAX_TEXT);
    if (!id || !text) {
      send(ws, { type: "error", message: "Teks kosong" });
      return;
    }
    if (session.rows.some((row) => row.id === id)) {
      send(ws, { type: "ack", id });
      return;
    }

    const row: Row = { id, text, at: new Date().toISOString() };
    session.rows.push(row);
    if (session.rows.length > MAX_ROWS) session.rows.shift();
    broadcast(session, { type: "row", row });
    send(ws, { type: "ack", id });
  });

  const leave = () => {
    bucket.delete(ws);
    broadcast(session, presence(session));
  };
  ws.on("close", leave);
  ws.on("error", leave);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`pindai-in mendengarkan di ${PORT}`);
});
