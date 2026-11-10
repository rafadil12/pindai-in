import { useEffect, useState } from "react";
import { MAX_FIELDS, parseForm } from "../../../shared/form.ts";
import { FIELD_TYPES, type Field, type FieldType, type JobForm } from "../../../shared/types.ts";

const TYPE_LABEL: Record<FieldType, string> = {
  text: "Teks",
  number: "Angka",
  date: "Tanggal",
  check: "Centang",
  choice: "Pilihan",
  barcode: "Barcode",
};

export function FormEditor({
  form,
  connected,
  problem,
  onApply,
}: {
  form: JobForm | null;
  connected: boolean;
  problem: string;
  onApply: (form: JobForm) => boolean;
}) {
  const [draft, setDraft] = useState<JobForm | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (form && !draft) setDraft(structuredClone(form));
  }, [form, draft]);

  useEffect(() => {
    if (problem) setNotice("");
  }, [problem]);

  if (!draft) return <p className="hint">Menyiapkan formulir.</p>;

  function update(id: string, patch: Partial<Field>) {
    setNotice("");
    setError("");
    setDraft((current) =>
      current
        ? { ...current, fields: current.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)) }
        : current,
    );
  }

  function move(index: number, direction: -1 | 1) {
    setNotice("");
    setDraft((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.fields.length) return current;
      const fields = [...current.fields];
      const [item] = fields.splice(index, 1);
      fields.splice(target, 0, item);
      return { ...current, fields };
    });
  }

  function addField() {
    setNotice("");
    setError("");
    setDraft((current) => {
      if (!current || current.fields.length >= MAX_FIELDS) return current;
      const field: Field = {
        id: nextId(current.fields),
        label: "Isian",
        type: "text",
        required: false,
        options: [],
      };
      return { ...current, fields: [...current.fields, field] };
    });
  }

  function removeField(id: string) {
    setNotice("");
    setDraft((current) => {
      if (!current || current.fields.length === 1) return current;
      return { ...current, fields: current.fields.filter((field) => field.id !== id) };
    });
  }

  function apply() {
    const parsed = parseForm(draft);
    if (!parsed.ok) {
      setError(parsed.error);
      setNotice("");
      return;
    }
    if (!onApply(parsed.value)) {
      setError("Belum tersambung ke server.");
      setNotice("");
      return;
    }
    setDraft(parsed.value);
    setError("");
    setNotice("Formulir dipakai di HP. Kode sesi tetap sama.");
  }

  return (
    <section className="card editor">
      <p className="eyebrow">Formulir pekerjaan</p>
      <h2>Susunan isian</h2>
      <p className="hint">Perubahan ini mengganti layar HP. Kode sesi dan saluran yang sama tetap dipakai.</p>
      <label htmlFor="form-name">Nama formulir</label>
      <input
        id="form-name"
        value={draft.name}
        maxLength={40}
        onChange={(event) => {
          setNotice("");
          setDraft({ ...draft, name: event.target.value });
        }}
      />
      {draft.fields.map((field, index) => (
        <div className="field" key={field.id}>
          <div className="form-grid">
            <label>
              Nama isian
              <input
                value={field.label}
                maxLength={40}
                onChange={(event) => update(field.id, { label: event.target.value })}
              />
            </label>
            <label>
              Jenis
              <select
                value={field.type}
                onChange={(event) => {
                  const type = event.target.value as FieldType;
                  update(field.id, {
                    type,
                    options: type === "choice" ? seededOptions(field.options) : [],
                  });
                }}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-line">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) => update(field.id, { required: event.target.checked })}
              />
              Wajib
            </label>
          </div>
          {field.type === "choice" && (
            <label>
              Opsi, satu baris satu pilihan
              <textarea
                rows={3}
                value={field.options.join("\n")}
                onChange={(event) => update(field.id, { options: event.target.value.split("\n") })}
              />
            </label>
          )}
          <div className="field-tools">
            <button type="button" className="ghost" disabled={index === 0} onClick={() => move(index, -1)}>
              Naik
            </button>
            <button
              type="button"
              className="ghost"
              disabled={index === draft.fields.length - 1}
              onClick={() => move(index, 1)}
            >
              Turun
            </button>
            <button
              type="button"
              className="ghost"
              disabled={draft.fields.length === 1}
              onClick={() => removeField(field.id)}
            >
              Hapus
            </button>
          </div>
        </div>
      ))}
      <div className="row-actions editor-actions">
        <button type="button" className="ghost" disabled={draft.fields.length >= MAX_FIELDS} onClick={addField}>
          Tambah isian
        </button>
        <button type="button" className="ghost" disabled={!form} onClick={() => form && setDraft(structuredClone(form))}>
          Kembalikan
        </button>
        <button type="button" disabled={!connected} onClick={apply}>
          Pakai formulir
        </button>
      </div>
      {notice && <p className="hint">{notice}</p>}
      {(error || problem) && <p className="warn">{error || problem}</p>}
    </section>
  );
}

function seededOptions(options: string[]) {
  const filled = options.map((option) => option.trim()).filter(Boolean);
  return filled.length > 0 ? options : ["Pilihan 1", "Pilihan 2"];
}

function nextId(fields: Field[]) {
  const used = new Set(fields.map((field) => field.id));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = `f${Math.random().toString(36).slice(2, 8)}`;
    if (!used.has(id) && /^[a-z][a-z0-9]{0,15}$/.test(id)) return id;
  }
  return `f${Date.now().toString(36).slice(-8)}`;
}
