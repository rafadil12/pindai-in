import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { useChannel } from "../useChannel";
import { Shell, formatTime } from "./Shell";

const CodeScan = lazy(() => import("./CodeScan").then((module) => ({ default: module.CodeScan })));

export function SenderPage({ code }: { code: string }) {
  const [phase, setPhase] = useState<"memeriksa" | "siap" | "hilang" | "gagal">("memeriksa");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const channel = useChannel("sender", phase === "siap" ? code : null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${code}`)
      .then((response) => {
        if (cancelled) return;
        setPhase(response.ok ? "siap" : "hilang");
      })
      .catch(() => {
        if (!cancelled) setPhase("gagal");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setNotice("");
    const ok = await channel.submit(crypto.randomUUID(), value);
    setSending(false);
    if (ok) {
      setText("");
      setNotice("Masuk ke komputer.");
      return;
    }
    setNotice("Belum terkirim. Cek sambungan, lalu kirim lagi.");
  }

  return (
    <Shell
      aside={
        <span className={channel.connected ? "status on" : "status"}>
          {phase === "siap" ? (channel.connected ? "Terhubung" : "Menyambung") : "Sesi"}
        </span>
      }
    >
      <section className="card send">
        <p className="eyebrow">Halaman kirim · {code}</p>
        <h1>Kirim teks ke komputer</h1>
        {phase === "hilang" && (
          <p className="warn">Sesi {code} tidak ada. Minta QR baru di komputer, lalu pindai lagi.</p>
        )}
        {phase === "gagal" && (
          <p className="warn">Server belum menjawab. Pastikan aplikasi di komputer masih berjalan.</p>
        )}
        {phase === "siap" && (
          <form onSubmit={onSubmit}>
            <Suspense fallback={<p className="hint">Menyiapkan kamera.</p>}>
              <CodeScan
                onValue={(value) => {
                  setText(value);
                  setNotice("Kode terisi. Periksa, lalu kirim.");
                }}
              />
            </Suspense>
            <label htmlFor="isi">Isi kiriman</label>
            <textarea
              id="isi"
              value={text}
              maxLength={500}
              rows={4}
              placeholder="Tulis atau pindai kode barang"
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" disabled={!channel.connected || sending || text.trim() === ""}>
              {sending ? "Mengirim" : "Kirim"}
            </button>
            {notice && <p className="hint">{notice}</p>}
          </form>
        )}
        {phase === "memeriksa" && <p className="hint">Memeriksa sesi.</p>}

        {channel.rows.length > 0 && (
          <ol className="sent">
            {channel.rows.map((row) => (
              <li key={row.id}>
                <span>{row.text}</span>
                <time>{formatTime(row.at)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Shell>
  );
}
