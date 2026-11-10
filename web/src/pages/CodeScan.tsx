import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

const MAX_TEXT = 500;

export function CodeScan({ onValue }: { onValue: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onValueRef = useRef(onValue);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  onValueRef.current = onValue;

  useEffect(() => {
    if (!scanning) return;
    const video = videoRef.current;
    if (!video) return;

    let stopped = false;
    const reader = new BrowserMultiFormatReader();
    const pending = reader.decodeFromVideoDevice(undefined, video, (result, _decodeError, controls) => {
      if (stopped || !result) return;
      const value = result.getText().trim().slice(0, MAX_TEXT);
      if (!value) return;
      stopped = true;
      stopControls(controls);
      onValueRef.current(value);
      setScanning(false);
    });

    pending.catch(() => {
      if (stopped) return;
      stopped = true;
      setScanning(false);
      setError("Kamera tidak bisa dibuka. Ambil foto kode, atau ketik nilainya.");
    });

    return () => {
      stopped = true;
      pending.then(stopControls).catch(() => undefined);
    };
  }, [scanning]);

  function start() {
    setError("");
    if (!window.isSecureContext) {
      setError("Kamera langsung hanya jalan di halaman aman. Ambil foto kode, atau ketik nilainya.");
      return;
    }
    setScanning(true);
  }

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    try {
      const result = await new BrowserMultiFormatReader().decodeFromImageUrl(url);
      const value = result.getText().trim().slice(0, MAX_TEXT);
      if (!value) {
        setError("Kode tidak terbaca dari foto itu. Coba lagi, atau ketik nilainya.");
        return;
      }
      onValueRef.current(value);
    } catch {
      setError("Kode tidak terbaca dari foto itu. Coba lagi, atau ketik nilainya.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="capture">
      <div className="row-actions">
        <button type="button" className="ghost" onClick={scanning ? () => setScanning(false) : start}>
          {scanning ? "Berhenti" : "Pindai kode"}
        </button>
        <label className="file-btn">
          Ambil foto kode
          <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
        </label>
      </div>
      {scanning && (
        <div className="preview">
          <video ref={videoRef} muted playsInline autoPlay />
        </div>
      )}
      <p className="hint">Hasil pindaian mengisi kotak di bawah. Periksa dulu, baru kirim.</p>
      {error && <p className="warn">{error}</p>}
    </div>
  );
}

function stopControls(controls: IScannerControls) {
  try {
    controls.stop();
  } catch {
    // The stream is already stopped when the preview closes.
  }
}
