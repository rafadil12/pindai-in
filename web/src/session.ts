let pending: Promise<string> | null = null;

export function bootReceiverSession(forceNew = false): Promise<string> {
  if (forceNew) pending = null;
  if (!pending) {
    pending = loadSession(forceNew).catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

async function loadSession(forceNew: boolean): Promise<string> {
  if (!forceNew) {
    const saved = sessionStorage.getItem("pindai-code");
    if (saved && /^[A-Z2-9]{6}$/.test(saved)) {
      const existing = await fetch(`/api/sessions/${saved}`);
      if (existing.ok) return saved;
      sessionStorage.removeItem("pindai-code");
    }
  }

  const created = await fetch("/api/sessions", { method: "POST" });
  if (!created.ok) throw new Error("Server tidak menjawab");
  const body = (await created.json()) as { code: string };
  sessionStorage.setItem("pindai-code", body.code);
  return body.code;
}

export async function joinTarget(code: string): Promise<{ url: string; alternatives: string[] }> {
  const onLoopback = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  let host = location.hostname;
  let alternatives: string[] = [];

  if (onLoopback) {
    try {
      const response = await fetch("/api/network");
      const body = (await response.json()) as { addresses: string[] };
      if (body.addresses[0]) {
        host = body.addresses[0];
        alternatives = body.addresses.slice(1);
      }
    } catch {
      host = location.hostname;
    }
  }

  const port = location.port ? `:${location.port}` : "";
  return {
    url: `${location.protocol}//${host}${port}/k/${code}`,
    alternatives: alternatives.map(
      (address) => `${location.protocol}//${address}${port}/k/${code}`,
    ),
  };
}
