"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  emptyCells,
  type AreaId,
  type CellMap,
} from "@/content/first-record";

export type LocalPhoto = { id: string; file: File };

export type RecordDraft = {
  cells: CellMap;
  photos: LocalPhoto[];
  view: "edit" | "summary";
  areaId: AreaId;
};

type RecordDraftContextValue = {
  draft: RecordDraft;
  setDraft: Dispatch<SetStateAction<RecordDraft>>;
};

const RecordDraftContext = createContext<RecordDraftContextValue | null>(null);

function emptyDraft(): RecordDraft {
  return {
    cells: emptyCells(),
    photos: [],
    view: "edit",
    areaId: "forehead",
  };
}

export function RecordDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RecordDraft>(emptyDraft);
  const value = useMemo(() => ({ draft, setDraft }), [draft]);
  return (
    <RecordDraftContext.Provider value={value}>
      {children}
    </RecordDraftContext.Provider>
  );
}

export function useRecordDraft() {
  const value = useContext(RecordDraftContext);
  if (!value) {
    throw new Error("useRecordDraft must render inside RecordDraftProvider");
  }
  return value;
}
