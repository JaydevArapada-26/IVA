export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'item';
}

/** Very small dependency-free HTML title/description extractor. Regex-based on purpose per
 * task scope (no full HTML parser dependency) — good enough for a best-effort ingestion pass,
 * not a substitute for a real scraper. */
export function extractTitleAndSummary(html: string): { title?: string; summary?: string } {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1]).trim() : undefined;

  const metaDescMatch =
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i.exec(html) ??
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i.exec(html);
  let summary = metaDescMatch?.[1] ? decodeHtmlEntities(metaDescMatch[1]).trim() : undefined;

  if (!summary) {
    const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
    const bodyHtml = bodyMatch?.[1] ?? html;
    const withoutScripts = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const paragraphMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(withoutScripts);
    const raw = paragraphMatch?.[1] ?? withoutScripts.replace(/<[^>]+>/g, ' ');
    const text = decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    summary = text.length > 0 ? text.slice(0, 400) : undefined;
  }

  const result: { title?: string; summary?: string } = {};
  if (title !== undefined) result.title = title;
  if (summary !== undefined) result.summary = summary;
  return result;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Minimal CSV parser: supports quoted fields (with embedded commas/newlines/escaped quotes) and
 * bare comma-separated fields. Not a full RFC 4180 implementation, but handles the common
 * scheme-import shape without pulling in a dependency. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i] ?? '';
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}
