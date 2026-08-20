// Display formatting for property stats. Real-estate values are kept as strings
// so formats like "2+1" beds, "2.5" baths, or "1,530" sqft survive unchanged.
export function formatStat(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  const s = String(value).trim();
  if (s === '') return '';
  // Pure numeric strings ("1530", "1530.20") get thousands separators.
  if (/^\d+(\.\d+)?$/.test(s)) {
    const [int, dec] = s.split('.');
    const intFormatted = Number(int).toLocaleString('en-US');
    return dec ? `${intFormatted}.${dec}` : intFormatted;
  }
  // Everything else ("2+1", "1,530", "2.5 baths") renders as-is.
  return s;
}
