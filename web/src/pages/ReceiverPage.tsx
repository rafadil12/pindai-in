import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cellText, columnsFor } from "../../../shared/form.ts";
import type { JobForm, Row } from "../../../shared/types.ts";
import { bootReceiverSession, joinTarget } from "../session";
import { useChannel } from "../useChannel";
import { FormEditor } from "./FormEditor";
import { Shell, formatTime } from "./Shell";

export function ReceiverPage() {
  const [code, setCode] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [bootError, setBootError] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
    if (code) {
      await fetch(`/api/sessions/${code}/expire`, { method: "POST" }).catch(() => undefined);
    }
    const next = await bootReceiverSession(true);
    const target = await joinTarget(next);
    setCode(next);
    setUrl(target.url);
    setAlternatives(target.alternatives);
  }

  async function download() {
    if (!code || channel.rows.length === 0 || downloading) return;
    setDownloading(true);
    try {
      if (!channel.form) return;
      const { downloadRows } = await import("../download");
      await downloadRows(code, channel.form, channel.rows);
    } finally {
      setDownloading(false);
    }
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
            <div className="feed-tools">
              <button
                type="button"
                className="ghost"
                disabled={!code || channel.rows.length === 0 || downloading}
                onClick={download}
              >
                {downloading ? "Mengunduh" : "Unduh Excel"}
              </button>
              <span>{channel.rows.length}</span>
            </div>
          </div>
          {channel.rows.length === 0 ? (
            <p className="empty">Belum ada kiriman. Isian dari HP akan muncul di sini.</p>
          ) : (
            <RowTable rows={channel.rows} form={channel.form} />
          )}
        </section>

        <FormEditor
          form={channel.form}
          connected={channel.connected}
          problem={channel.problem}
          onApply={channel.publishForm}
        />
      </div>
    </Shell>
  );
}

function RowTable({ rows, form }: { rows: Row[]; form: JobForm | null }) {
  if (!form) return null;
  const columns = columnsFor(form, rows);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Waktu</th>
            {columns.map((column) => (
              <th key={column.id}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>
              <td className="time">{formatTime(row.at)}</td>
              {columns.map((column) => (
                <td key={column.id}>{cellText(row, column.id)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
