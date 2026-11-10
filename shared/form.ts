import { FIELD_TYPES, type Cell, type Field, type FieldType, type JobForm, type Row } from "./types.ts";

export const MAX_FIELDS = 12;
export const MAX_NAME = 40;
export const MAX_LABEL = 40;
export const MAX_OPTIONS = 12;
export const MAX_OPTION = 40;
export const MAX_VALUE = 500;

const FIELD_ID = /^[a-z][a-z0-9]{0,15}$/;
const TYPES = new Set<string>(FIELD_TYPES);

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function defaultForm(): JobForm {
  return {
    name: "Kiriman",
    fields: [{ id: "isi", label: "Isi", type: "text", required: true, options: [] }],
  };
}

export function parseForm(input: unknown): Parsed<JobForm> {
  if (!isRecord(input)) return fail("Formulir tidak valid.");
  const name = cleanText(input.name);
  if (!name || name.length > MAX_NAME) return fail("Nama formulir diisi, paling panjang 40 karakter.");
  if (!Array.isArray(input.fields) || input.fields.length < 1 || input.fields.length > MAX_FIELDS) {
    return fail("Formulir punya 1 sampai 12 isian.");
  }

  const fields: Field[] = [];
  const seen = new Set<string>();
  for (const item of input.fields) {
    const parsed = parseField(item);
    if (!parsed.ok) return parsed;
    if (seen.has(parsed.value.id)) return fail("Ada isian dengan kode yang sama.");
    seen.add(parsed.value.id);
    fields.push(parsed.value);
  }
  return { ok: true, value: { name, fields } };
}

export function readValues(form: JobForm, input: unknown): Parsed<Cell[]> {
  if (!isRecord(input)) return fail("Isian tidak valid.");
  const cells: Cell[] = [];
  for (const field of form.fields) {
    const parsed = normalize(field, input[field.id]);
    if (!parsed.ok) return parsed;
    cells.push({ id: field.id, label: field.label, type: field.type, value: parsed.value });
  }
  if (cells.every((cell) => cell.value === "")) return fail("Isi minimal satu kolom.");
  return { ok: true, value: cells };
}

export function columnsFor(form: JobForm, rows: Row[]) {
  const columns = form.fields.map((field) => ({ id: field.id, label: field.label }));
  const seen = new Set(columns.map((column) => column.id));
  for (const row of rows) {
    for (const cell of row.cells) {
      if (seen.has(cell.id)) continue;
      seen.add(cell.id);
      columns.push({ id: cell.id, label: cell.label });
    }
  }
  return columns;
}

export function cellText(row: Row, id: string) {
  const cell = row.cells.find((item) => item.id === id);
  return cell ? displayValue(cell) : "";
}

export function summary(row: Row) {
  return row.cells
    .map((cell) => {
      const value = displayValue(cell);
      return value ? `${cell.label}: ${value}` : "";
    })
    .filter(Boolean)
    .join(" · ");
}

function parseField(input: unknown): Parsed<Field> {
  if (!isRecord(input)) return fail("Ada isian yang tidak valid.");
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!FIELD_ID.test(id)) return fail("Kode isian tidak valid.");
  const label = cleanText(input.label);
  if (!label || label.length > MAX_LABEL) return fail("Setiap isian perlu nama, paling panjang 40 karakter.");
  if (typeof input.type !== "string" || !TYPES.has(input.type)) return fail("Jenis isian tidak dikenal.");
  const type = input.type as FieldType;
  const required = input.required === true;
  if (type !== "choice") return { ok: true, value: { id, label, type, required, options: [] } };

  if (!Array.isArray(input.options)) return fail("Pilihan perlu daftar opsi.");
  const options: string[] = [];
  const seen = new Set<string>();
  for (const option of input.options) {
    const value = cleanText(option);
    if (!value) continue;
    if (value.length > MAX_OPTION) return fail("Setiap opsi paling panjang 40 karakter.");
    if (seen.has(value)) return fail("Opsi yang sama ditulis dua kali.");
    seen.add(value);
    options.push(value);
  }
  if (options.length < 1 || options.length > MAX_OPTIONS) return fail("Pilihan punya 1 sampai 12 opsi.");
  return { ok: true, value: { id, label, type, required, options } };
}

function normalize(field: Field, raw: unknown): Parsed<string> {
  const value = typeof raw === "string" ? raw.trim().slice(0, MAX_VALUE) : "";
  if (field.type === "check") {
    if (value !== "" && value !== "ya") return fail("Centang tidak valid.");
    if (field.required && value !== "ya") return fail(`Centang ${field.label}.`);
    return { ok: true, value: value === "ya" ? "ya" : "" };
  }
  if (!value) {
    if (field.required) return fail(`Isi ${field.label}.`);
    return { ok: true, value: "" };
  }
  if (field.type === "number" && !/^-?\d{1,12}(\.\d{1,4})?$/.test(value)) {
    return fail(`${field.label} harus angka.`);
  }
  if (field.type === "date" && !validDate(value)) return fail(`${field.label} harus tanggal.`);
  if (field.type === "choice" && !field.options.includes(value)) {
    return fail(`${field.label} di luar pilihan.`);
  }
  return { ok: true, value };
}

function displayValue(cell: Cell) {
  if (cell.type === "check") return cell.value === "ya" ? "Ya" : "";
  return cell.value;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(error: string): Parsed<never> {
  return { ok: false, error };
}
