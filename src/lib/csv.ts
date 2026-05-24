export function toCsv(rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

