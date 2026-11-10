import { lazy, Suspense, useState, type FormEvent } from "react";
import { sessionCodeFromScan } from "../sessionCode";

const CodeScan = lazy(() => import("./CodeScan").then((module) => ({ default: module.CodeScan })));

export function SessionJoin({ current, startOpen = false }: { current: string; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");

  function enter(value: string) {
    const next = sessionCodeFromScan(value);
    if (!next) {
      setError("Itu bukan kode sesi. Pindai QR di laptop, atau ketik 6 karakternya.");
      return;
    }
    if (next === current) {
      setError("Itu masih sesi yang sama.");
      return;
    }
    window.location.assign(`/k/${next}`);
  }

  function onManual(event: FormEvent) {
    event.preventDefault();
    enter(typed);
  }

  return (
    <div className="session-join">
      {!startOpen && (
        <button type="button" className="ghost" onClick={() => setOpen((value) => !value)}>
          {open ? "Tutup pindai sesi" : "Pindai kode sesi"}
        </button>
      )}
      {open && (
        <>
          <Suspense fallback={<p className="hint">Menyiapkan kamera.</p>}>
            <CodeScan
              scanLabel="Pindai kode sesi"
              photoLabel="Foto QR sesi"
              hint="Arahkan ke QR yang sedang tampil di laptop."
              insecureMessage="Kamera langsung hanya jalan di halaman aman. Foto QR-nya, atau ketik kodenya."
              missMessage="QR sesi tidak terbaca. Coba lagi, atau ketik kodenya."
              onValue={enter}
            />
          </Suspense>
          <form onSubmit={onManual}>
            <label htmlFor="kode-sesi">Kode sesi</label>
            <input
              id="kode-sesi"
              className="code-entry"
              value={typed}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="6 karakter"
              onChange={(event) => setTyped(event.target.value.toUpperCase())}
            />
            <button type="submit" disabled={typed.trim().length !== 6}>
              Masuk
            </button>
          </form>
          {error && <p className="warn">{error}</p>}
        </>
      )}
    </div>
  );
}
