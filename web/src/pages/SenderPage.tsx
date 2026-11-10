import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { useChannel } from "../useChannel";
import { NfcFill } from "./NfcFill";
import { SessionJoin } from "./SessionJoin";
import { Shell, formatTime } from "./Shell";

const CodeScan = lazy(() => import("./CodeScan").then((module) => ({ default: module.CodeScan })));

function makeId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SenderPage({ code }: { code: string }) {
  const [phase, setPhase] = useState<"memeriksa" | "siap" | "hilang" | "kedaluwarsa" | "gagal">("memeriksa");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const channel = useChannel("sender", phase === "siap" ? code : null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${code}`)
      .then((response) => {
        if (cancelled) return;
        if (response.status === 410) setPhase("kedaluwarsa");
        else setPhase(response.ok ? "siap" : "hilang");
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
    try {
      const ok = await channel.submit(makeId(), value);
      setSending(false);
      if (ok) {
        setText("");
        setNotice("Masuk ke komputer.");
        return;
      }
      setNotice("Belum terkirim. Cek sambungan, lalu kirim lagi.");
    } catch {
      setSending(false);
      setNotice("Belum terkirim. Cek sambungan, lalu kirim lagi.");
    }
  }

  const closed = phase === "kedaluwarsa" || channel.expired;
  const live = phase === "siap" && !closed;

  return (
    <Shell
      aside={
        <span className={!closed && channel.connected ? "status on" : "status"}>
          {closed ? "Sesi ditutup" : live ? (channel.connected ? "Terhubung" : "Menyambung") : "Sesi"}
        </span>
      }
    >
      <section className="card send">
        <p className="eyebrow">Halaman kirim · {code}</p>
        {phase === "gagal" && (
          <p className="warn">Server belum menjawab. Pastikan aplikasi di komputer masih berjalan.</p>
        )}
        {(phase === "hilang" || closed) && (
          <>
            <h1>{closed ? "Sesi ditutup" : "Sesi tidak ada"}</h1>
            <p className="warn">
              {closed
                ? `Sesi ${code} sudah diganti dari laptop. Pindai kode sesi yang baru.`
                : `Sesi ${code} tidak ada. Pindai QR yang sedang tampil di laptop.`}
            </p>
            <SessionJoin current={code} startOpen />
          </>
        )}
        {live && (
          <>
            <h1>Kirim teks ke komputer</h1>
            <SessionJoin current={code} />
          <form onSubmit={onSubmit}>
            <Suspense fallback={<p className="hint">Menyiapkan kamera.</p>}>
              <CodeScan
                onValue={(value) => {
                  setText(value);
                  setNotice("Kode terisi. Periksa, lalu kirim.");
                }}
              />
            </Suspense>
            <NfcFill
              onValue={(value) => {
                setText(value);
                setNotice("Tag NFC terisi. Periksa, lalu kirim.");
              }}
            />
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
          </>
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
