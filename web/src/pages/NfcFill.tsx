import { useEffect, useRef, useState } from "react";

const MAX_TEXT = 500;

type NdefRecord = {
  recordType: string;
  mediaType?: string | null;
  encoding?: string | null;
  data?: DataView | null;
  toRecords?: () => NdefRecord[];
};

type NdefReading = Event & {
  serialNumber?: string;
  message?: { records?: NdefRecord[] };
};

type NdefReaderInstance = EventTarget & {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
};

const URL_PREFIX = [
  "",
  "http://www.",
  "https://www.",
  "http://",
  "https://",
  "tel:",
  "mailto:",
  "ftp://anonymous:anonymous@",
  "ftp://ftp.",
  "ftps://",
  "sftp://",
  "smb://",
  "nfs://",
  "ftp://",
  "dav://",
  "news:",
  "telnet://",
  "imap:",
  "rtsp://",
  "urn:",
  "pop:",
  "sip:",
  "sips:",
  "tftp:",
  "btspp://",
  "btl2cap://",
  "btgoep://",
  "tcpobex://",
  "irdaobex://",
  "file://",
  "urn:epc:id:",
  "urn:epc:tag:",
  "urn:epc:pat:",
  "urn:epc:raw:",
  "urn:epc:",
  "urn:nfc:",
];

export function NfcFill({ onValue }: { onValue: (value: string) => void }) {
  const onValueRef = useRef(onValue);
  const abortRef = useRef<AbortController | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  onValueRef.current = onValue;

  useEffect(() => () => abortRef.current?.abort(), []);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setListening(false);
  }

  async function start() {
    setError("");
    if (!window.isSecureContext) {
      setError("Halaman ini masih HTTP. Buka alamat https dari QR laptop, izinkan peringatan sertifikat, lalu coba lagi.");
      return;
    }
    const Reader = (window as Window & { NDEFReader?: new () => NdefReaderInstance }).NDEFReader;
    if (!Reader) {
      setError("Browser ini tidak bisa membaca NFC. Pakai Chrome di Android, bukan iPhone.");
      return;
    }

    const ndef = new Reader();
    const controller = new AbortController();
    abortRef.current = controller;
    ndef.addEventListener("reading", (event) => {
      const value = valueFromReading(event as NdefReading);
      if (!value) {
        setError("Tag terbaca, tetapi browser tidak memberi teks maupun UID.");
        return;
      }
      onValueRef.current(value);
      stop();
    });
    ndef.addEventListener("readingerror", () => setError("Tag tidak terbaca. Tempel lagi."));
    setListening(true);
    try {
      await ndef.scan({ signal: controller.signal });
    } catch {
      if (controller.signal.aborted) return;
      stop();
      setError("NFC tidak diizinkan, atau perangkat ini tidak punya NFC.");
    }
  }

  return (
    <div className="capture">
      <div className="row-actions">
        <button type="button" className="ghost" onClick={listening ? stop : start}>
          {listening ? "Berhenti NFC" : "Tempel tag NFC"}
        </button>
      </div>
      <p className="hint">
        {listening
          ? "Siap. Tempelkan tag ke bagian belakang HP."
          : "Tekan tombol, izinkan NFC, lalu tempelkan tag. Kalau tag tidak berisi teks, yang diisi adalah UID chip. Nilainya masih bisa diperiksa."}
      </p>
      {error && <p className="warn">{error}</p>}
    </div>
  );
}

function valueFromReading(event: NdefReading) {
  const text = textFromRecords(event.message?.records ?? []);
  const value = text || formatUid(event.serialNumber);
  return value.slice(0, MAX_TEXT);
}

function formatUid(serialNumber?: string) {
  const raw = (serialNumber ?? "").trim();
  if (!raw) return "";
  const compact = raw.replace(/[:\s-]/g, "");
  if (/^[0-9a-f]+$/i.test(compact) && compact.length >= 4 && compact.length % 2 === 0) {
    return compact.toUpperCase();
  }
  return raw.toUpperCase();
}

function textFromRecords(records: NdefRecord[]): string {
  for (const record of records) {
    const text = textFromRecord(record);
    if (text) return text;
  }
  return "";
}

function textFromRecord(record: NdefRecord): string {
  if (record.recordType === "smart-poster" && record.toRecords) {
    return textFromRecords(record.toRecords());
  }
  const bytes = recordBytes(record);
  if (bytes.length === 0) return "";
  const mediaType = record.mediaType || (record.recordType.includes("/") ? record.recordType : "");
  if (record.recordType === "mime" || mediaType.startsWith("text/")) {
    return new TextDecoder(record.encoding || "utf-8").decode(bytes).replaceAll("\u0000", "").trim();
  }
  if (record.recordType === "text") {
    if (record.encoding) {
      return new TextDecoder(record.encoding).decode(bytes).replaceAll("\u0000", "").trim();
    }
    const languageLength = bytes[0] & 0x3f;
    const start = 1 + languageLength;
    if (start >= bytes.length) return "";
    const encoding = bytes[0] & 0x80 ? "utf-16" : "utf-8";
    return new TextDecoder(encoding).decode(bytes.subarray(start)).trim();
  }
  if (record.recordType === "url" || record.recordType === "absolute-url") {
    const plain = new TextDecoder().decode(bytes).trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(plain)) return plain;
    if (bytes[0] < URL_PREFIX.length) {
      return `${URL_PREFIX[bytes[0]]}${new TextDecoder().decode(bytes.subarray(1))}`.trim();
    }
    return plain;
  }
  return "";
}

function recordBytes(record: NdefRecord) {
  if (!record.data) return new Uint8Array();
  return new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength);
}
