"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { primaryButtonClass } from "@/content/ui";
import { ProfileWizardDialog } from "@/components/profile-wizard";

const PreviewContext = createContext<(() => void) | null>(null);

export function useOpenPreview() {
  const open = useContext(PreviewContext);
  if (!open) {
    throw new Error("OpenPreviewButton must render inside PreviewProvider");
  }
  return open;
}

export function OpenPreviewButton({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const open = useOpenPreview();
  return (
    <button
      type="button"
      className={`${primaryButtonClass} ${className}`}
      onClick={open}
    >
      {children}
    </button>
  );
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openSignal, setOpenSignal] = useState(0);

  const openPreview = useCallback(() => {
    setOpenSignal((value) => value + 1);
  }, []);

  return (
    <PreviewContext.Provider value={openPreview}>
      {children}
      <ProfileWizardDialog
        dialogRef={dialogRef}
        openSignal={openSignal}
        onClosed={() => {}}
      />
    </PreviewContext.Provider>
  );
}
