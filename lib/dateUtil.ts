/**
 * Adds `years` to `date`, clamping to the last day of the target month
 * instead of silently rolling into the next month. `Date.setFullYear` only
 * misbehaves this way for a Feb 29 anchor landing on a non-leap target year
 * (every other month has the same length every year) — e.g. an anchor of
 * 2024-02-29 plus 1 year would otherwise become 2025-03-01, not 2025-02-28,
 * quietly pushing a compliance due-date a day later than intended.
 */
export function addYearsClamped(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const month = date.getMonth();
  const daysInTargetMonth = new Date(targetYear, month + 1, 0).getDate();
  const clampedDay = Math.min(date.getDate(), daysInTargetMonth);

  const result = new Date(date);
  result.setFullYear(targetYear, month, clampedDay);
  return result;
}
