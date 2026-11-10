import { useEffect, useRef, useState } from "react";

const MAX_TEXT = 500;

type NdefRecord = {
  recordType: string;
  data: DataView;
};

type NdefReaderInstance = {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  onreading: ((event: { message: { records: NdefRecord[] } }) => void) | null;
  onreadingerror: (() => void) | null;
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
    const Reader = (window as Window & { NDEFReader?: new () => NdefReaderInstance }).NDEFReader;
    if (!Reader) {
      setError("Browser ini tidak bisa membaca NFC. Pakai Chrome di Android.");
      return;
    }
    if (!window.isSecureContext) {
      setError("NFC butuh halaman HTTPS. Lewat alamat HTTP, tag tidak bisa dibaca.");
      return;
    }

    const ndef = new Reader();
    const controller = new AbortController();
    abortRef.current = controller;
    setListening(true);
    try {
      await ndef.scan({ signal: controller.signal });
      ndef.onreading = (event) => {
        const value = textFromRecords(event.message.records).slice(0, MAX_TEXT);
        if (!value) {
          setError("Tag terbaca, tetapi tidak ada teks.");
          return;
        }
        onValueRef.current(value);
        stop();
      };
      ndef.onreadingerror = () => setError("Tag tidak terbaca. Tempel lagi.");
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
      <p className="hint">Tempel tag ke HP. Nilainya mengisi kotak, lalu masih bisa diperiksa.</p>
      {error && <p className="warn">{error}</p>}
    </div>
  );
}

function textFromRecords(records: NdefRecord[]) {
  for (const record of records) {
    const text = textFromRecord(record);
    if (text) return text;
  }
  return "";
}

function textFromRecord(record: NdefRecord) {
  const bytes = new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength);
  if (record.recordType === "text") {
    if (bytes.length === 0) return "";
    const languageLength = bytes[0] & 0x3f;
    return new TextDecoder().decode(bytes.subarray(Math.min(bytes.length, 1 + languageLength))).trim();
  }
  if (record.recordType === "url") {
    if (bytes.length === 0) return "";
    const prefix = URL_PREFIX[bytes[0]] ?? "";
    return `${prefix}${new TextDecoder().decode(bytes.subarray(1))}`.trim();
  }
  if (record.recordType === "absolute-url" || record.recordType === "mime") {
    return new TextDecoder().decode(bytes).trim();
  }
  return "";
}
