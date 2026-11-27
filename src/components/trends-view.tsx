"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useCheckinSession } from "@/components/checkin-session";
import { useVisitToday } from "@/components/visit-clock";
import {
  MOOD_LABEL,
  RANGE_OPTIONS,
  buildTrends,
  isRangeKey,
  type Comparison,
  type DayPoint,
  type RangeKey,
  type TrendsResult,
} from "@/lib/checkin/analysis";
import { formatMinutes } from "@/lib/checkin/date";
import { labels, quietLinkClass } from "@/content/ui";

const RANGE_LABEL: Record<RangeKey, string> = {
  7: "近 7 天",
  14: "近 14 天",
  30: "近 30 天",
};

const rangeListeners = new Set<() => void>();

function subscribeRange(onStoreChange: () => void): () => void {
  rangeListeners.add(onStoreChange);
  return () => rangeListeners.delete(onStoreChange);
}

function readRange(): RangeKey {
  const value = Number(new URLSearchParams(window.location.search).get("range"));
  return isRangeKey(value) ? value : 7;
}

function chooseRange(next: RangeKey) {
  window.history.replaceState(null, "", `/trends?range=${next}`);
  rangeListeners.forEach((listener) => listener());
}

export function TrendsView() {
  const { records } = useCheckinSession();
  const today = useVisitToday();
  const range = useSyncExternalStore(subscribeRange, readRange, () => 7 as RangeKey);
  const data = useMemo(
    () => (today ? buildTrends(records, { range, today }) : null),
    [records, range, today],
  );

  function choose(next: RangeKey) {
    chooseRange(next);
  }

  return (
    <>
      <a className="skip-link" href="#trends-main">
        {labels.skip}
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/checkin" className="inline-flex min-h-11 items-center font-bold">
            回去打卡
          </Link>
          <p className="font-bold text-purple">趋势</p>
        </div>
      </header>
      <main id="trends-main" tabIndex={-1} className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-snug">趋势与对照</h1>
        <p className="mt-3 leading-relaxed">睡眠、运动、心情。只看这次访问里记下的日子。</p>
        <p className="mt-3 rounded-md bg-chip px-4 py-3 font-bold leading-relaxed">
          这些记录只存在这次访问里。刷新或关闭后会消失。缺记录不是 0。
        </p>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="时间范围">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={option === range}
              className={option === range ? `${quietLinkClass} bg-chip` : quietLinkClass}
              onClick={() => choose(option)}
            >
              {RANGE_LABEL[option]}
            </button>
          ))}
        </div>

        {data ? (
        <>
        <p className="mt-4 leading-relaxed">
          最近 {data.coverage.window} 天 · {data.coverage.recorded} 天有记录
          {data.coverage.missing > 0 ? ` · ${data.coverage.missing} 天缺记录` : ""}
          {data.coverage.partial > 0 ? ` · 其中 ${data.coverage.partial} 天只记了一部分` : ""}
        </p>

        {data.coverage.recorded === 0 ? (
          <section className="mt-8 rounded-lg border border-line bg-paper p-6">
            <h2 className="text-2xl leading-snug">这段时间还没有记录</h2>
            <p className="mt-3 leading-relaxed">
              记满几天以后，这里会出现睡眠、运动和心情的分布，以及它们在同一天的对照。对照只描述数字差别，不说明谁导致了谁。
            </p>
            <Link href="/checkin" className={`${quietLinkClass} mt-5`}>
              去打卡
            </Link>
          </section>
        ) : (
          <div className="mt-8 grid gap-6">
            <SleepCard data={data} />
            <ExerciseCard data={data} />
            <MoodCard data={data} />
            <section>
              <h2 className="text-2xl leading-snug">对照</h2>
              <p className="mt-2 leading-relaxed">
                只看一起出现的情况，不排好坏，也不推断因果，不是诊断。
              </p>
              <div className="mt-4 grid gap-4">
                {data.comparisons.map((comparison) => (
                  <CompareCard key={comparison.id} comparison={comparison} />
                ))}
              </div>
            </section>
          </div>
        )}
        </>
        ) : (
          <p className="mt-4 leading-relaxed">正在按上海时区整理这几天。</p>
        )}
      </main>
    </>
  );
}

function SleepCard({ data }: { data: TrendsResult }) {
  const values = data.days.map((day) => day.sleepMinutes).filter((value): value is number => value != null);
  const scale = Math.max(600, ...values);
  return (
    <section className="rounded-lg border border-line bg-paper p-6">
      <h2 className="text-2xl leading-snug">睡眠</h2>
      <p className="mt-2 leading-relaxed">
        {data.sleep.nights} 晚 · 平均 {data.sleep.avgDisplay}
        {data.sleep.minMinutes != null && data.sleep.maxMinutes != null
          ? ` · 最短 ${formatMinutes(data.sleep.minMinutes)} · 最长 ${formatMinutes(data.sleep.maxMinutes)}`
          : ""}
      </p>
      <Chart
        label="每天的实际睡眠时长"
        days={data.days}
        bar={(day) =>
          day.sleepMinutes == null
            ? { kind: "missing", text: "未记录" }
            : {
                kind: "value",
                percent: Math.max(8, Math.round((day.sleepMinutes / scale) * 100)),
                text: formatMinutes(day.sleepMinutes),
              }
        }
      />
      <p className="mt-3 leading-relaxed">虚线格子是未记录，不按 0 分钟算。</p>
    </section>
  );
}

function ExerciseCard({ data }: { data: TrendsResult }) {
  const values = data.days
    .map((day) => day.exerciseMinutes)
    .filter((value): value is number => value != null);
  const scale = Math.max(60, ...values);
  return (
    <section className="rounded-lg border border-line bg-paper p-6">
      <h2 className="text-2xl leading-snug">运动</h2>
      <p className="mt-2 leading-relaxed">
        {data.exercise.activeDays} 天有运动 · 共 {data.exercise.totalMinutes} 分钟 · 没有运动{" "}
        {data.exercise.restDays} 天
        {data.exercise.unclearDays > 0 ? ` · 记不清 ${data.exercise.unclearDays} 天` : ""}
      </p>
      <Chart
        label="每天的运动分钟数"
        days={data.days}
        bar={(day) => {
          if (day.exerciseStatus === "missing") return { kind: "missing", text: "未记录" };
          if (day.exerciseStatus === "unclear") return { kind: "unclear", text: "记不清" };
          if (day.exerciseStatus === "no") return { kind: "value", percent: 8, text: "没有运动" };
          return {
            kind: "value",
            percent: Math.max(12, Math.round(((day.exerciseMinutes ?? 0) / scale) * 100)),
            text: `${day.exerciseMinutes} 分钟`,
          };
        }}
      />
      <p className="mt-3 leading-relaxed">没有运动才是 0 分钟。记不清和未记录都不进平均。</p>
    </section>
  );
}

function MoodCard({ data }: { data: TrendsResult }) {
  return (
    <section className="rounded-lg border border-line bg-paper p-6">
      <h2 className="text-2xl leading-snug">心情</h2>
      <p className="mt-2 leading-relaxed">
        {data.mood.answeredDays} 天选出了感受。「说不清」和「暂不回答」不进下面的次数。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.mood.counts.length > 0 ? (
          data.mood.counts.map((item) => (
            <span key={item.key} className="rounded-full bg-chip px-3 py-1 font-bold">
              {item.label} {item.count} 天
            </span>
          ))
        ) : (
          <span className="rounded-full bg-chip px-3 py-1">这段时间没有选出具体感受</span>
        )}
      </div>
      <ul className="mt-4 grid gap-2">
        {data.days.map((day) => (
          <li key={day.date} className="flex flex-wrap items-center gap-2">
            <span className="w-14 font-bold">{day.monthDay}</span>
            {day.moodState === "answered"
              ? day.moodTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-chip px-3 py-1">
                    {MOOD_LABEL[tag]}
                  </span>
                ))
              : null}
            {day.moodState === "unclear" ? <span>说不清</span> : null}
            {day.moodState === "declined" ? <span>暂不回答</span> : null}
            {day.moodState === "missing" ? <span>未记录</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CompareCard({ comparison }: { comparison: Comparison }) {
  const max = Math.max(1, ...comparison.groups.map((group) => group.value ?? 0));
  return (
    <article className="rounded-lg border border-line border-l-4 border-l-purple bg-paper p-6">
      <h3 className="text-xl leading-snug">{comparison.title}</h3>
      {comparison.hint ? <p className="mt-2 leading-relaxed">{comparison.hint}</p> : null}
      <div className="mt-4 grid gap-3">
        {comparison.groups.map((group) => (
          <div key={group.label}>
            <div className="flex justify-between gap-3">
              <span>
                {group.label}
                <span className="ml-2">{group.n > 0 ? `${group.n} 天` : "无记录"}</span>
              </span>
              <span className="font-bold">{group.display}</span>
            </div>
            <div className="mt-1 h-2 bg-chip">
              <div
                className="h-2 bg-purple"
                style={{
                  width:
                    group.value == null
                      ? "0%"
                      : `${Math.max(4, Math.round((group.value / max) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {comparison.status === "ok" && comparison.conclusion ? (
        <p className="mt-4 leading-relaxed">
          {comparison.conclusion} 这是同一批记录里的共同出现，不代表因果，也不是诊断。
        </p>
      ) : (
        <p className="mt-4 leading-relaxed">
          样本还不够。{comparison.insufficientNote ?? "再多记几天就能比较。"}
        </p>
      )}
    </article>
  );
}

function Chart({
  days,
  label,
  bar,
}: {
  days: DayPoint[];
  label: string;
  bar: (day: DayPoint) =>
    | { kind: "missing"; text: string }
    | { kind: "unclear"; text: string }
    | { kind: "value"; percent: number; text: string };
}) {
  return (
    <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label={label}>
      {days.map((day) => {
        const column = bar(day);
        return (
          <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${day.monthDay} ${column.text}`}>
            {column.kind === "value" ? (
              <div className="w-full bg-purple" style={{ height: `${column.percent}%` }} />
            ) : (
              <div className="h-full w-full border border-dashed border-line" />
            )}
            <span className="mt-1 truncate text-center text-sm">{day.dayOfMonth}</span>
          </div>
        );
      })}
    </div>
  );
}
