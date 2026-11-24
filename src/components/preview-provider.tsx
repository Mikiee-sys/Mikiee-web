"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const openModeRef = useRef<"fresh" | "resume">("fresh");
  const [openSignal, setOpenSignal] = useState(0);
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  const openPreview = useCallback(() => {
    openModeRef.current = "fresh";
    setOpenSignal((value) => value + 1);
  }, []);

  const resumeWizard = useCallback(() => {
    openModeRef.current = "resume";
    setOpenSignal((value) => value + 1);
  }, []);

  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    if (previous === "/first-record" && pathname === "/") {
      resumeWizard();
    }
  }, [pathname, resumeWizard]);

  return (
    <PreviewContext.Provider value={openPreview}>
      {children}
      <ProfileWizardDialog
        dialogRef={dialogRef}
        openSignal={openSignal}
        openModeRef={openModeRef}
        onClosed={() => {}}
      />
    </PreviewContext.Provider>
  );
}
