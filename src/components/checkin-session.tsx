"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CheckinRecord } from "@/lib/checkin/types";

type CheckinSessionValue = {
  records: CheckinRecord[];
  findRecord: (localDate: string) => CheckinRecord | null;
  saveRecord: (record: CheckinRecord) => void;
};

const CheckinSessionContext = createContext<CheckinSessionValue | null>(null);

export function CheckinSessionProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<CheckinRecord[]>([]);

  const findRecord = useCallback(
    (localDate: string) =>
      records.find((record) => record.localDate === localDate) ?? null,
    [records],
  );

  const saveRecord = useCallback((record: CheckinRecord) => {
    setRecords((current) => {
      const next = current.filter((item) => item.localDate !== record.localDate);
      next.push(record);
      next.sort((a, b) => a.localDate.localeCompare(b.localDate));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ records, findRecord, saveRecord }),
    [records, findRecord, saveRecord],
  );

  return (
    <CheckinSessionContext.Provider value={value}>
      {children}
    </CheckinSessionContext.Provider>
  );
}

export function useCheckinSession() {
  const value = useContext(CheckinSessionContext);
  if (!value) {
    throw new Error("useCheckinSession must render inside CheckinSessionProvider");
  }
  return value;
}
