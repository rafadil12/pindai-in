import { useEffect, useRef, useState } from "react";
import type { JobForm, Row, ServerMessage } from "../../shared/types.ts";

type Role = "receiver" | "sender";
type Waiter = (ok: boolean, message?: string) => void;

export function useChannel(role: Role, code: string | null) {
  const [form, setForm] = useState<JobForm | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [receivers, setReceivers] = useState(0);
  const [senders, setSenders] = useState(0);
  const [connected, setConnected] = useState(false);
  const [expired, setExpired] = useState(false);
  const [problem, setProblem] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const waiters = useRef(new Map<string, Waiter>());

  useEffect(() => {
    setExpired(false);
    setForm(null);
    setRows([]);
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
          assignForm(message.form);
          setRows(message.rows);
          setReceivers(message.receivers);
          setSenders(message.senders);
          setProblem("");
        } else if (message.type === "form") {
          assignForm(message.form);
          setProblem("");
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
          setProblem("");
        } else if (message.type === "expired") {
          stopped = true;
          setExpired(true);
          setConnected(false);
          for (const settle of waiters.current.values()) settle(false);
          waiters.current.clear();
          socket?.close();
        } else if (message.type === "error") {
          setProblem(message.message);
          for (const [id, settle] of waiters.current) {
            settle(false, message.message);
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

    function assignForm(next: JobForm) {
      setForm((current) => (current && JSON.stringify(current) === JSON.stringify(next) ? current : next));
    }
  }, [role, code]);

  const submit = (id: string, values: Record<string, string>) =>
    new Promise<{ ok: true } | { ok: false; message?: string }>((resolve) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        resolve({ ok: false });
        return;
      }
      const timer = window.setTimeout(() => {
        waiters.current.delete(id);
        resolve({ ok: false });
      }, 4000);
      waiters.current.set(id, (ok, message) => {
        window.clearTimeout(timer);
        resolve(ok ? { ok: true } : { ok: false, message });
      });
      socket.send(JSON.stringify({ type: "submit", id, values }));
    });

  const publishForm = (next: JobForm) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type: "form", form: next }));
    return true;
  };

  return { form, rows, receivers, senders, connected, expired, problem, submit, publishForm };
}
