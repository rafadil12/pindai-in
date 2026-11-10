import { useEffect, useRef, useState } from "react";
import type { Row, ServerMessage } from "../../shared/types.ts";

type Role = "receiver" | "sender";

export function useChannel(role: Role, code: string | null) {
  const [rows, setRows] = useState<Row[]>([]);
  const [receivers, setReceivers] = useState(0);
  const [senders, setSenders] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const waiters = useRef(new Map<string, (ok: boolean) => void>());

  useEffect(() => {
    if (!code) return;
    let stopped = false;
    let socket: WebSocket | null = null;
    let retry = 0;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${proto}://${location.host}/ws?role=${role}&code=${code}`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (stopped) return;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        let message: ServerMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerMessage;
        } catch {
          return;
        }
        if (message.type === "state") {
          setRows(message.rows);
          setReceivers(message.receivers);
          setSenders(message.senders);
        } else if (message.type === "row") {
          setRows((current) =>
            current.some((row) => row.id === message.row.id) ? current : [...current, message.row],
          );
        } else if (message.type === "presence") {
          setReceivers(message.receivers);
          setSenders(message.senders);
        } else if (message.type === "ack") {
          waiters.current.get(message.id)?.(true);
          waiters.current.delete(message.id);
        } else if (message.type === "error") {
          for (const [id, settle] of waiters.current) {
            settle(false);
            waiters.current.delete(id);
          }
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        setConnected(false);
        retry = window.setTimeout(connect, 1000);
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(retry);
      socket?.close();
      for (const settle of waiters.current.values()) settle(false);
      waiters.current.clear();
    };
  }, [role, code]);

  const submit = (id: string, text: string) =>
    new Promise<boolean>((resolve) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        resolve(false);
        return;
      }
      const timer = window.setTimeout(() => {
        waiters.current.delete(id);
        resolve(false);
      }, 4000);
      waiters.current.set(id, (ok) => {
        window.clearTimeout(timer);
        resolve(ok);
      });
      socket.send(JSON.stringify({ type: "submit", id, text }));
    });

  return { rows, receivers, senders, connected, submit };
}
