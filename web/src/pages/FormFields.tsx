import { lazy, Suspense } from "react";
import type { Field, JobForm } from "../../../shared/types.ts";

const CodeScan = lazy(() => import("./CodeScan").then((module) => ({ default: module.CodeScan })));

export function FormFields({
  form,
  values,
  onChange,
}: {
  form: JobForm;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <>
      {form.fields.map((field) => (
        <div className="field" key={field.id}>
          {field.type === "check" ? (
            <label className="check-line" htmlFor={field.id}>
              <input
                id={field.id}
                data-field-id={field.id}
                type="checkbox"
                checked={values[field.id] === "ya"}
                onChange={(event) => onChange(field.id, event.target.checked ? "ya" : "")}
              />
              {field.label}
              {field.required ? " *" : ""}
            </label>
          ) : (
            <>
              <label htmlFor={field.id}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <Control field={field} value={values[field.id] ?? ""} onChange={onChange} />
            </>
          )}
        </div>
      ))}
    </>
  );
}

function Control({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (id: string, value: string) => void;
}) {
  if (field.type === "text") {
    return (
      <textarea
        id={field.id}
        data-field-id={field.id}
        rows={3}
        maxLength={500}
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
      />
    );
  }
  if (field.type === "choice") {
    return (
      <select
        id={field.id}
        data-field-id={field.id}
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
      >
        <option value="">Pilih</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "barcode") {
    return (
      <>
        <Suspense fallback={<p className="hint">Menyiapkan kamera.</p>}>
          <CodeScan
            scanLabel={`Pindai ${field.label}`}
            hint="Hasil pindaian mengisi isian ini. Periksa dulu, baru kirim."
            onValue={(next) => onChange(field.id, next)}
          />
        </Suspense>
        <input
          id={field.id}
          data-field-id={field.id}
          value={value}
          maxLength={500}
          placeholder="Ketik atau pindai"
          onChange={(event) => onChange(field.id, event.target.value)}
        />
      </>
    );
  }
  return (
    <input
      id={field.id}
      data-field-id={field.id}
      type={field.type === "date" ? "date" : "text"}
      inputMode={field.type === "number" ? "decimal" : undefined}
      value={value}
      maxLength={500}
      onChange={(event) => onChange(field.id, event.target.value)}
    />
  );
}
