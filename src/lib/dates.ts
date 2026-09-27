/** Calendar-date helpers. Dates are UTC-midnight timestamps so DST never adds or loses a day. */

export const DAY = 86400000;

export const parse = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) : NaN);
export const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
export const todayIso = () => { const d = new Date(); return iso(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };
export const long = (t: number) => new Date(t).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** Adds whole months, clamping to month end (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(t: number, n: number) {
  const D = new Date(t);
  const target = D.getUTCMonth() + n;
  const last = new Date(Date.UTC(D.getUTCFullYear(), target + 1, 0)).getUTCDate();
  return Date.UTC(D.getUTCFullYear(), target, Math.min(D.getUTCDate(), last));
}
/** Calendar difference in years, months, days (a ≤ b). */
export function ymd(a: number, b: number) {
  const A = new Date(a), B = new Date(b);
  let months = (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + B.getUTCMonth() - A.getUTCMonth();
  if (addMonths(a, months) > b) months--;
  return { y: Math.floor(months / 12), m: months % 12, d: Math.round((b - addMonths(a, months)) / DAY) };
}
export function businessDays(a: number, b: number) {
  let n = 0;
  for (let t = a; t < b; t += DAY) { const w = new Date(t).getUTCDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}
export function addDuration(t: number, y: number, m: number, w: number, d: number, business: boolean) {
  let r = addMonths(t, m + y * 12);
  if (business) {
    let left = Math.abs(d + w * 5);
    const step = d + w * 5 < 0 ? -DAY : DAY;
    while (left > 0) { r += step; const wd = new Date(r).getUTCDay(); if (wd !== 0 && wd !== 6) left--; }
  } else r += (d + w * 7) * DAY;
  return r;
}
export function isoWeek(t: number) {
  const d = new Date(t);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = d.getUTCFullYear();
  return { week: Math.ceil(((d.getTime() - Date.UTC(y, 0, 1)) / DAY + 1) / 7), year: y };
}
