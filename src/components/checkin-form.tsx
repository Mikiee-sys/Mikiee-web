"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCheckinSession } from "@/components/checkin-session";
import { useVisitToday } from "@/components/visit-clock";
import { addDays } from "@/lib/checkin/date";
import { validateCheckinPayload } from "@/lib/checkin/validation";
import type {
  ExerciseIntensity,
  ExerciseStatus,
  MoodTag,
  SleepFeeling,
} from "@/lib/checkin/types";
import { labels, primaryButtonClass, quietLinkClass } from "@/content/ui";

const chip =
  "inline-flex min-h-11 items-center rounded-md border border-line bg-paper px-3 py-2";
const chipOn =
  "inline-flex min-h-11 items-center rounded-md border border-purple bg-chip px-3 py-2 font-bold text-purple";

const FEELINGS: { key: SleepFeeling; label: string }[] = [
  { key: "rested", label: "有精神" },
  { key: "neutral", label: "一般" },
  { key: "tired", label: "仍疲惫" },
  { key: "unclear", label: "说不清" },
];

const EXERCISE_OPTIONS: { key: ExerciseStatus; label: string }[] = [
  { key: "yes", label: "有运动" },
  { key: "no", label: "没有运动" },
  { key: "unclear", label: "记不清" },
];

const INTENSITIES: { key: ExerciseIntensity; label: string }[] = [
  { key: "easy", label: "轻松" },
  { key: "moderate", label: "中等" },
  { key: "hard", label: "费力" },
  { key: "unknown", label: "不确定" },
];

const MOODS: { key: MoodTag; label: string }[] = [
  { key: "calm", label: "平静" },
  { key: "happy", label: "开心" },
  { key: "anxious", label: "紧张" },
  { key: "low", label: "低落" },
  { key: "irritable", label: "烦躁" },
  { key: "other", label: "其他" },
];

type MoodMode = "tags" | "unclear" | "declined";

interface ItemRow {
  id: string;
  type: string;
  minutes: string;
  intensity: ExerciseIntensity;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Math.random().toString(36).slice(2)}`;
}

function newItem(): ItemRow {
  return { id: uid(), type: "", minutes: "", intensity: "easy" };
}

function prettyDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

export function CheckinForm() {
  const router = useRouter();
  const { findRecord, saveRecord } = useCheckinSession();
  const today = useVisitToday();
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [pickedNight, setPickedNight] = useState<string | null>(null);
  const localDate = pickedDate ?? today ?? "";
  const night = pickedNight ?? (localDate ? addDays(localDate, -1) : "");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [feeling, setFeeling] = useState<SleepFeeling | null>(null);
  const [status, setStatus] = useState<ExerciseStatus | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [moodMode, setMoodMode] = useState<MoodMode>("tags");
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function loadDate(next: string) {
    const record = findRecord(next);
    setPickedDate(next);
    setPickedNight(record?.sleep?.night ?? addDays(next, -1));
    setHours(record?.sleep ? String(record.sleep.hours) : "");
    setMinutes(record?.sleep ? String(record.sleep.minutes) : "");
    setFeeling(record?.sleep?.feeling ?? null);
    setStatus(record?.exercise?.status ?? null);
    setItems(
      record?.exercise?.status === "yes"
        ? record.exercise.items.map((item) => ({
            id: uid(),
            type: item.type,
            minutes: String(item.minutes),
            intensity: item.intensity,
          }))
        : [],
    );
    if (record?.mood?.unclear) setMoodMode("unclear");
    else if (record?.mood?.declined) setMoodMode("declined");
    else setMoodMode("tags");
    setTags(record?.mood?.unclear || record?.mood?.declined ? [] : (record?.mood?.tags ?? []));
    setErrors([]);
  }

  const totalMinutes = items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);

  function toggleTag(key: MoodTag) {
    if (moodMode !== "tags") {
      setMoodMode("tags");
      setTags([key]);
      return;
    }
    setTags((prev) => (prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key]));
  }

  function toggleMode(next: Exclude<MoodMode, "tags">) {
    if (moodMode === next) {
      setMoodMode("tags");
      return;
    }
    setMoodMode(next);
    setTags([]);
  }

  function handleSubmit() {
    const payload = {
      localDate,
      sleep:
        hours !== "" || minutes !== ""
          ? {
              night,
              hours: hours === "" ? 0 : Number(hours),
              minutes: minutes === "" ? 0 : Number(minutes),
              ...(feeling ? { feeling } : {}),
            }
          : null,
      exercise: status
        ? {
            status,
            items:
              status === "yes"
                ? items.map((item) => ({
                    type: item.type.trim(),
                    minutes: Number(item.minutes),
                    intensity: item.intensity,
                  }))
                : [],
          }
        : null,
      mood:
        moodMode === "unclear"
          ? { tags: [], unclear: true }
          : moodMode === "declined"
            ? { tags: [], declined: true }
            : tags.length > 0
              ? { tags }
              : null,
    };

    const outcome = validateCheckinPayload(payload);
    if (!outcome.ok) {
      setErrors(outcome.errors.map((item) => item.message));
      return;
    }

    saveRecord(outcome.record);
    router.push("/trends?range=7");
  }

  return (
    <>
      <a className="skip-link" href="#checkin-main">
        {labels.skip}
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center font-bold">
            返回首页
          </Link>
          <Link href="/trends" className="inline-flex min-h-11 items-center font-bold text-purple">
            趋势
          </Link>
        </div>
      </header>
      <main id="checkin-main" tabIndex={-1} className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-snug">睡眠、运动与心情</h1>
        <p className="mt-4 text-lg leading-9">
          先记下这一觉睡得怎么样、这天有没有动，再看看这天的感受。三块都可以只填一部分。
        </p>
        <p className="mt-3 rounded-md bg-chip px-4 py-3 font-bold leading-relaxed">
          记录只存在这次访问里。刷新或关闭页面后会消失，不会上传，也不会写成档案。留空表示没填，不会当成 0。
        </p>

        <label className="mt-8 block">
          <span className="font-bold">记录日期</span>
          <input
            className="mt-2 block min-h-12 rounded-md border border-line bg-paper px-3"
            type="date"
            value={localDate}
            max={today || undefined}
            disabled={!today}
            aria-label="记录日期"
            onChange={(event) => {
              if (event.target.value) loadDate(event.target.value);
            }}
          />
        </label>

        <section className="mt-8 rounded-lg border border-line bg-paper p-6">
          <h2 className="text-2xl leading-snug">睡眠</h2>
          <p className="mt-2 leading-relaxed">
            这一觉是 {prettyDay(night)} 晚上睡的。只算实际睡着的时间。
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <label>
              <span className="sr-only">睡眠小时</span>
              <input
                className="min-h-12 w-24 rounded-md border border-line bg-cream px-3"
                type="number"
                inputMode="numeric"
                min={0}
                max={24}
                placeholder="小时"
                value={hours}
                aria-label="睡眠小时"
                onChange={(event) => setHours(event.target.value)}
              />
              <span className="ml-2">小时</span>
            </label>
            <label>
              <span className="sr-only">睡眠分钟</span>
              <input
                className="min-h-12 w-24 rounded-md border border-line bg-cream px-3"
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                placeholder="分钟"
                value={minutes}
                aria-label="睡眠分钟"
                onChange={(event) => setMinutes(event.target.value)}
              />
              <span className="ml-2">分钟</span>
            </label>
          </div>
          <p className="mt-2 leading-relaxed">两个都留空，就表示这天没有记睡眠。</p>
          <p className="mt-4 font-bold">醒来时的感受（选填）</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="醒来时的感受">
            {FEELINGS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={feeling === option.key ? chipOn : chip}
                aria-pressed={feeling === option.key}
                onClick={() => setFeeling((prev) => (prev === option.key ? null : option.key))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-line bg-paper p-6">
          <h2 className="text-2xl leading-snug">运动</h2>
          <p className="mt-2 leading-relaxed">
            {totalMinutes > 0 ? `合计 ${totalMinutes} 分钟` : "可留空"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="当天是否运动">
            {EXERCISE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={status === option.key}
                className={status === option.key ? chipOn : chip}
                onClick={() => {
                  setStatus(option.key);
                  if (option.key === "yes" && items.length === 0) setItems([newItem()]);
                  if (option.key !== "yes") setItems([]);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 leading-relaxed">
            没有运动请选「没有运动」。留空表示没填，不会当成 0 分钟。记不清单独算，不进对照。
          </p>
          {status === "yes" ? (
            <div className="mt-4 grid gap-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2">
                  <input
                    className="min-h-12 min-w-36 flex-1 rounded-md border border-line bg-cream px-3"
                    placeholder={index === 0 ? "如：快走" : "再记一次"}
                    value={item.type}
                    aria-label="运动名称"
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, type: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                  <input
                    className="min-h-12 w-24 rounded-md border border-line bg-cream px-3"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    placeholder="分钟"
                    value={item.minutes}
                    aria-label="分钟数"
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id ? { ...entry, minutes: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                  <select
                    className="min-h-12 rounded-md border border-line bg-cream px-3"
                    value={item.intensity}
                    aria-label="强度"
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, intensity: event.target.value as ExerciseIntensity }
                            : entry,
                        ),
                      )
                    }
                  >
                    {INTENSITIES.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={quietLinkClass}
                    aria-label="删除这条运动"
                    onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                  >
                    删除
                  </button>
                </div>
              ))}
              {items.length < 12 ? (
                <button
                  type="button"
                  className={quietLinkClass}
                  onClick={() => setItems((prev) => [...prev, newItem()])}
                >
                  添加一次运动
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-lg border border-line bg-paper p-6">
          <h2 className="text-2xl leading-snug">心情</h2>
          <p className="mt-3 font-bold">这天你有哪些感受？</p>
          <p className="mt-2 leading-relaxed">
            可多选，也可以一个都不选。这不是心理测评，也不会给心情排好坏。
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="心情标签">
            {MOODS.map((option) => {
              const selected = moodMode === "tags" && tags.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  className={selected ? chipOn : chip}
                  aria-pressed={selected}
                  onClick={() => toggleTag(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="心情回答方式">
            <button
              type="button"
              className={moodMode === "unclear" ? chipOn : chip}
              aria-pressed={moodMode === "unclear"}
              onClick={() => toggleMode("unclear")}
            >
              说不清
            </button>
            <button
              type="button"
              className={moodMode === "declined" ? chipOn : chip}
              aria-pressed={moodMode === "declined"}
              onClick={() => toggleMode("declined")}
            >
              暂不回答
            </button>
          </div>
          <p className="mt-2 leading-relaxed">
            「说不清」和「暂不回答」与上面的具体感受互斥，两个也不能同时选。
          </p>
        </section>

        {errors.length > 0 ? (
          <div className="mt-6 rounded-md bg-chip px-4 py-3" role="alert">
            {errors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        <button type="button" className={`${primaryButtonClass} mt-8`} onClick={handleSubmit}>
          记在这次访问里并查看趋势
        </button>
        <p className="mt-3 leading-relaxed">同一天再记会覆盖这次访问里的上一条。记录不是诊断。</p>
      </main>
    </>
  );
}
