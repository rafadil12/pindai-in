import writeXlsxFile from "write-excel-file/browser";
import { cellText, columnsFor } from "../../shared/form.ts";
import type { JobForm, Row } from "../../shared/types.ts";

export async function downloadRows(code: string, form: JobForm, rows: Row[]) {
  const columns = columnsFor(form, rows);
  const header = ["No", "Waktu", ...columns.map((column) => column.label)].map((label) => ({
    value: label,
    fontWeight: "bold" as const,
  }));
  const body = rows.map((row, index) => [
    { value: index + 1 },
    { value: formatDateTime(row.at) },
    ...columns.map((column) => ({ value: cellText(row, column.id) })),
  ]);

  await writeXlsxFile([header, ...body], {
    sheet: "Kiriman",
    columns: [{ width: 8 }, { width: 24 }, ...columns.map(() => ({ width: 28 }))],
  }).toFile(`pindai-in-${code}.xlsx`);
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}
