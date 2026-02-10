import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { ParsedFile } from "./types";

export function parseFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          const rows = results.data as Record<string, string>[];
          const columns = results.meta.fields || [];
          resolve({
            fileName,
            fileType: "csv",
            columns,
            rows,
            totalRows: rows.length,
          });
        },
        error(err) {
          reject(new Error(`CSV parse error: ${err.message}`));
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
            defval: "",
          });
          const columns =
            jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          resolve({
            fileName,
            fileType: "xlsx",
            columns,
            rows: jsonData.map((row) => {
              const strRow: Record<string, string> = {};
              for (const key of columns) {
                strRow[key] = String(row[key] ?? "");
              }
              return strRow;
            }),
            totalRows: jsonData.length,
          });
        } catch (err) {
          reject(new Error(`Excel parse error: ${(err as Error).message}`));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type. Please upload .xlsx, .xls, or .csv"));
    }
  });
}

export function exportToFile(
  originalFile: ParsedFile,
  enrichedRows: Record<string, string>[],
  newColumns: string[]
): Blob {
  const allColumns = [...originalFile.columns, ...newColumns];
  const mergedRows = originalFile.rows.map((row, i) => {
    const enriched = enrichedRows[i] || {};
    return { ...row, ...enriched };
  });

  if (originalFile.fileType === "csv") {
    const csv = Papa.unparse(mergedRows, { columns: allColumns });
    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  } else {
    const ws = XLSX.utils.json_to_sheet(mergedRows, { header: allColumns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enriched");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
}
