import writeXlsxFile from "write-excel-file/browser";

type SavedRow = {
  at: string;
  text: string;
};

export async function downloadRows(code: string, rows: SavedRow[]) {
  const header = ["No", "Waktu", "Isi"].map((label) => ({
    value: label,
    fontWeight: "bold" as const,
  }));
  const body = rows.map((row, index) => [
    { value: index + 1 },
    { value: formatDateTime(row.at) },
    { value: row.text },
  ]);

  await writeXlsxFile([header, ...body], {
    sheet: "Kiriman",
    columns: [{ width: 8 }, { width: 24 }, { width: 48 }],
  }).toFile(`pindai-in-${code}.xlsx`);
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}
