"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  emptyAnswers,
  toggleAnswer,
  wizardCopy,
  wizardSteps,
  type QuestionDef,
  type WizardAnswers,
} from "@/content/profile-wizard";
import { primaryButtonClass, quietLinkClass } from "@/content/ui";

type Phase = "intro" | "steps" | "done";

const optionClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line bg-paper px-3 py-2 text-left text-base leading-snug text-ink hover:border-purple";
const optionSelectedClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-purple bg-chip px-3 py-2 text-left text-base font-bold leading-snug text-purple";

function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const items = [
    ...dialog.querySelectorAll<HTMLElement>(
      "button, a[href], input, select, textarea",
    ),
  ].filter((item) => !item.hasAttribute("disabled") && item.tabIndex !== -1);
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

function QuestionBlock({
  question,
  answer,
  onToggle,
  onText,
}: {
  question: QuestionDef;
  answer: WizardAnswers[string];
  onToggle: (optionId: string) => void;
  onText: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="text-base font-bold leading-snug text-purple">
        {question.prompt}
      </legend>
      {question.hint ? (
        <p className="mt-1 text-base leading-relaxed text-ink/80">{question.hint}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {question.options.map((option) => {
          const selected = answer.selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              className={selected ? optionSelectedClass : optionClass}
              onClick={() => onToggle(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {question.options.some(
        (option) => option.opensText && answer.selected.includes(option.id),
      ) ? (
        <label className="mt-3 block">
          <span className="sr-only">{wizardCopy.otherPlaceholder}</span>
          <textarea
            value={answer.text ?? ""}
            onChange={(event) => onText(event.target.value)}
            rows={3}
            placeholder={wizardCopy.otherPlaceholder}
            className="mt-1 w-full rounded-md border border-line bg-cream px-3 py-2 text-base leading-relaxed text-ink"
          />
        </label>
      ) : null}
    </fieldset>
  );
}

export function ProfileWizardDialog({
  dialogRef,
  openSignal,
  onClosed,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  openSignal: number;
  onClosed: () => void;
}) {
  const titleId = useId();
  const leadId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(() => emptyAnswers());
  const [mountedFields, setMountedFields] = useState(false);

  useEffect(() => {
    if (openSignal === 0) return;
    setPhase("intro");
    setStepIndex(0);
    setAnswers(emptyAnswers());
    setMountedFields(true);
  }, [openSignal]);

  useEffect(() => {
    if (openSignal === 0 || !mountedFields) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, [openSignal, mountedFields, dialogRef]);

  useEffect(() => {
    if (!mountedFields || !dialogRef.current?.open) return;
    if (phase === "intro" || phase === "done") {
      startRef.current?.focus();
      return;
    }
    headingRef.current?.focus();
  }, [mountedFields, phase, stepIndex, dialogRef]);

  const step = wizardSteps[stepIndex];
  const totalSteps = wizardSteps.length;

  const closeDialog = () => {
    dialogRef.current?.close();
    setMountedFields(false);
    onClosed();
  };

  let body: ReactNode = null;
  if (!mountedFields) {
    body = null;
  } else if (phase === "intro") {
    body = (
      <>
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-snug outline-none"
        >
          {wizardCopy.title}
        </h2>
        <p id={leadId} className="mt-3 leading-relaxed">
          {wizardCopy.introLead}
        </p>
        <p className="mt-3 leading-relaxed">{wizardCopy.introNote}</p>
        <ol className="mt-5 grid gap-2">
          {wizardSteps.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-chip px-3 py-3"
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-yellow text-base font-bold text-purple"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 font-semibold leading-snug">
                {item.title}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            ref={startRef}
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setPhase("steps");
              setStepIndex(0);
            }}
          >
            {wizardCopy.start}
          </button>
          <button
            type="button"
            className={quietLinkClass}
            onClick={closeDialog}
          >
            {wizardCopy.close}
          </button>
        </div>
      </>
    );
  } else if (phase === "done") {
    body = (
      <>
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-snug outline-none"
        >
          {wizardCopy.doneTitle}
        </h2>
        <p id={leadId} className="mt-3 leading-relaxed">
          {wizardCopy.doneBody}
        </p>
        <button
          ref={startRef}
          type="button"
          className={`${primaryButtonClass} mt-6`}
          onClick={closeDialog}
        >
          {wizardCopy.close}
        </button>
      </>
    );
  } else if (step) {
    body = (
      <>
        <p className="text-base font-bold text-purple">
          {wizardCopy.stepProgress(stepIndex + 1, totalSteps)}
        </p>
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-[clamp(1.5rem,3vw,1.875rem)] font-bold leading-snug outline-none"
        >
          {step.title}
        </h2>
        {step.lead ? (
          <p id={leadId} className="mt-3 leading-relaxed">
            {step.lead}
          </p>
        ) : (
          <span id={leadId} className="sr-only">
            {wizardCopy.stepProgress(stepIndex + 1, totalSteps)}
          </span>
        )}
        <div className="mt-5 grid gap-7">
          {step.questions.map((question) => (
            <QuestionBlock
              key={question.id}
              question={question}
              answer={answers[question.id] ?? { selected: [] }}
              onToggle={(optionId) =>
                setAnswers((prev) => toggleAnswer(prev, question, optionId))
              }
              onText={(value) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: {
                    selected: prev[question.id]?.selected ?? [],
                    text: value,
                  },
                }))
              }
            />
          ))}
        </div>
        {step.closing ? (
          <p className="mt-6 leading-relaxed">{step.closing}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className={quietLinkClass}
            onClick={() => {
              if (stepIndex === 0) {
                setPhase("intro");
                return;
              }
              setStepIndex((value) => value - 1);
            }}
          >
            {wizardCopy.back}
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              if (stepIndex >= totalSteps - 1) {
                setPhase("done");
                return;
              }
              setStepIndex((value) => value + 1);
            }}
          >
            {stepIndex >= totalSteps - 1 ? wizardCopy.finish : wizardCopy.next}
          </button>
          <button type="button" className={quietLinkClass} onClick={closeDialog}>
            {wizardCopy.close}
          </button>
        </div>
      </>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      id="profile-preview"
      aria-labelledby={titleId}
      aria-describedby={leadId}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      onClose={() => {
        setMountedFields(false);
        onClosed();
      }}
      onKeyDown={(event) => keepFocusInside(event)}
    >
      <div aria-hidden="true" className="h-1 bg-yellow" />
      <div className="px-5 py-6 sm:px-7 sm:py-7">{body}</div>
    </dialog>
  );
}
