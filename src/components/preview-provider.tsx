"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { labels, primaryButtonClass, stages } from "@/content/ui";

const PreviewContext = createContext<(() => void) | null>(null);

function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const items = [
    ...dialog.querySelectorAll<HTMLElement>(
      "button, a[href], summary, input, select, textarea",
    ),
  ].filter((item) => !item.hasAttribute("disabled"));
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const inside = active instanceof HTMLElement && dialog.contains(active);
  if (event.shiftKey && (!inside || active === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (!inside || active === last)) {
    event.preventDefault();
    first.focus();
  }
}

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
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const statusId = useId();

  const openPreview = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    closeRef.current?.focus();
  }, []);

  return (
    <PreviewContext.Provider value={openPreview}>
      {children}
      <dialog
        ref={dialogRef}
        id="profile-preview"
        aria-labelledby={titleId}
        aria-describedby={statusId}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        onKeyDown={(event) => keepFocusInside(event)}
      >
        <div aria-hidden="true" className="h-1 bg-yellow" />
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <h2
            id={titleId}
            className="text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-snug"
          >
            {labels.previewTitle}
          </h2>
          <p id={statusId} className="mt-3 leading-relaxed">
            {labels.building}。{labels.noSave}
          </p>
          <ol className="mt-5 grid gap-3">
            {stages.map((stage, index) => (
              <li
                key={stage}
                className="flex items-center gap-3 rounded-2xl bg-chip px-3 py-3"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-yellow text-base font-bold text-purple"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 font-semibold leading-snug">
                  {stage}
                </span>
                <span className="shrink-0 text-base font-bold">
                  {labels.building}
                </span>
              </li>
            ))}
          </ol>
          <button
            ref={closeRef}
            type="button"
            className={`${primaryButtonClass} mt-6 w-full sm:w-auto`}
            onClick={() => dialogRef.current?.close()}
          >
            {labels.close}
          </button>
        </div>
      </dialog>
    </PreviewContext.Provider>
  );
}
