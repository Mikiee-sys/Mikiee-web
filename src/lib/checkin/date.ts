/** 日期一律用本地日历日的 "YYYY-MM-DD" 字符串，避免跨时区错日 */

export const TZ = "Asia/Shanghai";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function todayInTz(tz = TZ, now: Date = new Date()): string {
  // en-CA 的日期格式正好是 YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const dt = parseDate(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatDate(dt);
}

export function daysBetween(from: string, to: string): number {
  const ms = parseDate(to).getTime() - parseDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** 生成 [from, to] 闭区间的每一天 */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const total = daysBetween(from, to);
  for (let i = 0; i <= total; i += 1) out.push(addDays(from, i));
  return out;
}

export function weekday(date: string): string {
  return WEEKDAYS[parseDate(date).getUTCDay()];
}

/** "11/21" */
export function monthDay(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function dayOfMonth(date: string): string {
  return String(Number(date.split("-")[2]));
}

export function formatMinutes(total: number | null): string {
  if (total == null) return "—";
  const rounded = Math.round(total);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} 分钟`;
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分`;
}

export function formatDelta(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m} 分钟`;
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分`;
}
