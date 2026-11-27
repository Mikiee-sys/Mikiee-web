"use client";

import { useSyncExternalStore } from "react";
import { todayInTz } from "@/lib/checkin/date";

function subscribe(): () => void {
  return () => {};
}

/** 上海日历日。预渲染时是 null，浏览器里再读，避免把当前时间写进静态页面。 */
export function useVisitToday(): string | null {
  return useSyncExternalStore(subscribe, todayInTz, () => null);
}
