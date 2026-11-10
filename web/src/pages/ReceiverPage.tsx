import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { bootReceiverSession, joinTarget } from "../session";
import { useChannel } from "../useChannel";
import { Shell, formatTime } from "./Shell";

export function ReceiverPage() {
  const [code, setCode] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [bootError, setBootError] = useState("");
  const [copied, setCopied] = useState(false);
  const channel = useChannel("receiver", code);

  useEffect(() => {
    let cancelled = false;
    bootReceiverSession()
      .then(async (next) => {
        const target = await joinTarget(next);
        if (cancelled) return;
        setCode(next);
        setUrl(target.url);
        setAlternatives(target.alternatives);
      })
      .catch(() => {
        if (!cancelled) setBootError("Server belum menjawab. Jalankan npm run dev, lalu muat ulang halaman ini.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function newSession() {
    setCopied(false);
    const next = await bootReceiverSession(true);
    const target = await joinTarget(next);
    setCode(next);
    setUrl(target.url);
    setAlternatives(target.alternatives);
  }

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Shell
      aside={
        <span className={channel.connected ? "status on" : "status"}>
          {channel.connected ? "Terhubung" : code ? "Menyambung" : "Menyiapkan"}
        </span>
      }
    >
      <div className="layout">
        <section className="card pair">
          <p className="eyebrow">Halaman penerima</p>
          <h1>Pindai kode ini dari HP</h1>
          <div className="finder">
            {url ? (
              <QRCodeSVG value={url} size={208} bgColor="#ffffff" fgColor="#1a1f1c" level="M" />
            ) : (
              <div className="finder-wait">Menyiapkan sesi</div>
            )}
          </div>
          {code && <p className="code">{code}</p>}
          {url && (
            <>
              <p className="join">{url}</p>
              <div className="row-actions">
                <button type="button" onClick={copyUrl}>
                  {copied ? "Tautan tersalin" : "Salin tautan"}
                </button>
                <button type="button" className="ghost" onClick={newSession}>
                  Sesi baru
                </button>
              </div>
            </>
          )}
          {bootError && <p className="warn">{bootError}</p>}
          {alternatives.length > 0 && (
            <p className="hint">
              Kalau alamat itu tidak terbuka di HP, coba {alternatives.join(" atau ")}.
            </p>
          )}
          <p className="hint">
            {channel.senders} pengirim terhubung. Beberapa HP boleh memakai QR yang sama.
          </p>
        </section>

        <section className="card feed">
          <div className="feed-head">
            <h2>Kiriman</h2>
            <span>{channel.rows.length}</span>
          </div>
          {channel.rows.length === 0 ? (
            <p className="empty">Belum ada kiriman. Teks dari HP akan muncul di sini.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Waktu</th>
                    <th>Isi</th>
                  </tr>
                </thead>
                <tbody>
                  {channel.rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td className="time">{formatTime(row.at)}</td>
                      <td>{row.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
