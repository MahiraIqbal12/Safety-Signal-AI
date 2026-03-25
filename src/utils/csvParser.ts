import type { Review } from "@/types/review";

export interface ParsedCSVResult {
  reviews: Omit<Review, "id">[];
  errors: string[];
  totalRows: number;
}

/**
 * Parse a CSV file in the browser and return structured review objects.
 * Supports CSV columns: review_text, product_name, review_date, user_id, risk_level,
 * issue_category, authenticity_score, ai_confidence, timestamp, flagged
 */
export function parseCSV(file: File): Promise<ParsedCSVResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          resolve({ reviews: [], errors: ["CSV file is empty or has no data rows."], totalRows: 0 });
          return;
        }

        // Original headers, trimmed, no quotes
        const headersRaw = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        const reviews: Omit<Review, "id">[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length !== headersRaw.length) {
            errors.push(`Row ${i + 1}: column count mismatch (expected ${headersRaw.length}, got ${values.length})`);
            continue;
          }

          const row: Record<string, string> = Object.fromEntries(
            headersRaw.map((h, idx) => [h, values[idx]])
          );

          // Map CSV fields exactly to Review fields
          reviews.push({
            review_text: row["review_text"] || "",
            product_name: row["product_name"] || "",
            review_date: row["review_date"] ? new Date(row["review_date"]).toISOString().split("T")[0] : null,
            user_id: row["user_id"] || null,
            risk_level: (row["risk_level"] as Review["risk_level"]) || "Low",
            issue_category: row["issue_category"] || "Unknown",
            authenticity_score: row["authenticity_score"] ? parseFloat(row["authenticity_score"]) : 0,
            ai_confidence: row["ai_confidence"] ? parseFloat(row["ai_confidence"]) : 0,
            timestamp: row["timestamp"] || new Date().toISOString(),
            flagged: row["flagged"] === "true" || row["flagged"] === "1",
            classification: row["classification"] || "Low Value Lead"
          });
        }

        resolve({ reviews, errors, totalRows: lines.length - 1 });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

/** Handle quoted CSV fields with commas inside. */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}