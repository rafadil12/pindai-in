import { useEffect, useState, type FormEvent } from "react";
import { readValues } from "../../../shared/form.ts";
import type { FieldType, JobForm } from "../../../shared/types.ts";
import { useChannel } from "../useChannel";
import { FormFields } from "./FormFields";
import { NfcFill } from "./NfcFill";
import { SessionJoin } from "./SessionJoin";
import { Shell, formatTime } from "./Shell";
import { summary } from "../../../shared/form.ts";

function makeId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SenderPage({ code }: { code: string }) {
  const [phase, setPhase] = useState<"memeriksa" | "siap" | "hilang" | "kedaluwarsa" | "gagal">("memeriksa");
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const channel = useChannel("sender", phase === "siap" ? code : null);
  const form = channel.form;

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

  useEffect(() => {
    if (!form) return;
    setValues((current) => {
      const next: Record<string, string> = {};
      for (const field of form.fields) next[field.id] = current[field.id] ?? "";
      return next;
    });
  }, [form]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form || sending) return;
    const parsed = readValues(form, values);
    if (!parsed.ok) {
      setNotice(parsed.error);
      return;
    }
    const payload = Object.fromEntries(parsed.value.map((cell) => [cell.id, cell.value]));
    setSending(true);
    setNotice("");
    try {
      const result = await channel.submit(makeId(), payload);
      setSending(false);
      if (result.ok) {
        setValues(Object.fromEntries(form.fields.map((field) => [field.id, ""])));
        setNotice("Masuk ke komputer.");
        return;
      }
      setNotice(result.message || "Belum terkirim. Cek sambungan, lalu kirim lagi.");
    } catch {
      setSending(false);
      setNotice("Belum terkirim. Cek sambungan, lalu kirim lagi.");
    }
  }

  function fillFromNfc(value: string) {
    if (!form) return;
    const target = nfcTarget(form);
    if (!target) {
      setNotice("Tidak ada isian teks untuk tag ini.");
      return;
    }
    setValues((current) => ({ ...current, [target.id]: value }));
    setNotice(`Tag masuk ke ${target.label}. Periksa, lalu kirim.`);
  }

  const closed = phase === "kedaluwarsa" || channel.expired;
  const live = phase === "siap" && !closed;
  const filled = Object.values(values).some((value) => value.trim() !== "");

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
            <h1>{form?.name ?? "Menyiapkan formulir"}</h1>
            <SessionJoin current={code} />
            {form && (
              <form onSubmit={onSubmit}>
                <FormFields
                  form={form}
                  values={values}
                  onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
                />
                <NfcFill onValue={fillFromNfc} />
                <button type="submit" disabled={!channel.connected || sending || !filled}>
                  {sending ? "Mengirim" : "Kirim"}
                </button>
                {notice && <p className="hint">{notice}</p>}
              </form>
            )}
          </>
        )}
        {phase === "memeriksa" && <p className="hint">Memeriksa sesi.</p>}

        {channel.rows.length > 0 && (
          <ol className="sent">
            {channel.rows.map((row) => (
              <li key={row.id}>
                <span>{summary(row)}</span>
                <time>{formatTime(row.at)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Shell>
  );
}

function nfcTarget(form: JobForm) {
  const active = document.activeElement;
  const activeId = active instanceof HTMLElement ? active.dataset.fieldId : undefined;
  const focused = form.fields.find((field) => field.id === activeId);
  if (focused && fillable(focused.type)) return focused;
  return (
    form.fields.find((field) => field.type === "text" || field.type === "barcode") ??
    form.fields.find((field) => field.type === "number")
  );
}

function fillable(type: FieldType) {
  return type === "text" || type === "barcode" || type === "number";
}
