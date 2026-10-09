import { TZDate } from '@date-fns/tz'

/** All dates are handled in El Salvador time (UTC−6, no daylight saving), like the seed and the iOS app. */
export const TIME_ZONE = 'America/El_Salvador'

/** Weeks start on Monday (AppCalendar.firstWeekday = 2 in iOS). */
export const WEEK_STARTS_ON = 1 as const

export function now(): TZDate {
  return TZDate.tz(TIME_ZONE)
}

/** Converts any instant to El Salvador time so date-fns works on local days. */
export function inZone(value: Date | string | number): TZDate {
  return new TZDate(new Date(value).getTime(), TIME_ZONE)
}

/** Parses a Postgres `date` (`yyyy-MM-dd`) as the start of that day in El Salvador. */
export function parseDay(text: string): TZDate {
  const [year, month, day] = text.split('-').map(Number)
  return new TZDate(year, month - 1, day, TIME_ZONE)
}

/** Formats a date as `yyyy-MM-dd` in El Salvador time. */
export function dayString(date: Date): string {
  const local = inZone(date)
  const month = String(local.getMonth() + 1).padStart(2, '0')
  const day = String(local.getDate()).padStart(2, '0')
  return `${local.getFullYear()}-${month}-${day}`
}
