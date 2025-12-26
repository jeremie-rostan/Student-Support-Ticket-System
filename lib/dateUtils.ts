/**
 * Parse a date string in local timezone (not UTC)
 * This prevents "2025-12-25" from being interpreted as UTC midnight
 * which would show as Dec 24 in US timezones
 */
export function parseLocalDate(dateString: string | Date): Date {
  // If it's already a Date object, return it as-is
  if (dateString instanceof Date) {
    return dateString;
  }

  // If it's already a full ISO string with time, use it as-is
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  // For date-only strings like "2025-12-25", parse in local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
