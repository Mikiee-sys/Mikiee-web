"use client";

import { useState } from "react";
import { PlaceFrame } from "@/components/place-frame";
import { dailyChoices } from "@/content/places";
import { primaryButtonClass } from "@/content/ui";

const fields = [
  { id: "sleep", label: "最近一段时间，睡眠大体怎样？", options: dailyChoices.sleep },
  { id: "diet", label: "最近一段时间，饮食大体怎样？", options: dailyChoices.diet },
  { id: "mood", label: "最近一段时间，心情大体怎样？", options: dailyChoices.mood },
] as const;

export default function DailyPage() {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  return (
    <PlaceFrame title="日常生活" kicker="日常生活">
      <p className="mt-6 text-lg leading-9">
        没有对错。这几题只是帮你记住最近的日常，不是每日日志，也不说明生活习惯导致了长痘。
      </p>
      <p className="mt-3 rounded-md bg-chip px-4 py-3 font-bold leading-relaxed">
        选择只留在这次打开的页面里。刷新后会消失，不会上传。
      </p>
      <form
        className="mt-8 grid gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        {fields.map((field) => (
          <fieldset key={field.id} className="border-0 p-0">
            <legend className="text-xl font-bold leading-snug text-purple">
              {field.label}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {field.options.map((option) => {
                const selected = picked[field.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    className={
                      selected
                        ? "inline-flex min-h-11 items-center rounded-md border border-purple bg-chip px-3 py-2 font-bold text-purple"
                        : "inline-flex min-h-11 items-center rounded-md border border-line bg-paper px-3 py-2"
                    }
                    onClick={() => {
                      setSaved(false);
                      setPicked((current) => ({ ...current, [field.id]: option }));
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <button type="submit" className={primaryButtonClass}>
          记在这次页面里
        </button>
        {saved ? (
          <p role="status" className="leading-relaxed">
            已记在这次页面里。关掉或刷新之后不会留下。
          </p>
        ) : null}
      </form>
    </PlaceFrame>
  );
}
