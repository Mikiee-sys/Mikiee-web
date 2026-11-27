import {
  addDays,
  dateRange,
  dayOfMonth,
  formatDelta,
  formatMinutes,
  monthDay,
  weekday,
} from "./date";
import type {
  CheckinRecord,
  ExerciseStatus,
  MoodTag,
  SleepFeeling,
} from "./types";

/** 对照结论的最低样本门槛：低于这个数只提示「再多记几天」 */
export const MIN_SAMPLE = 3;
const MIN_FEELING_SAMPLE = 2;
const MIN_PAIR_DAYS = 2;

export const RANGE_OPTIONS = [7, 14, 30] as const;
export type RangeKey = (typeof RANGE_OPTIONS)[number];

export function isRangeKey(value: number): value is RangeKey {
  return (RANGE_OPTIONS as readonly number[]).includes(value);
}

export const MOOD_ORDER: MoodTag[] = [
  "calm",
  "happy",
  "anxious",
  "low",
  "irritable",
  "other",
];

export const MOOD_LABEL: Record<MoodTag, string> = {
  calm: "平静",
  happy: "开心",
  anxious: "紧张",
  low: "低落",
  irritable: "烦躁",
  other: "其他",
};

export const FEELING_LABEL: Record<SleepFeeling, string> = {
  rested: "有精神",
  neutral: "一般",
  tired: "仍疲惫",
  unclear: "说不清",
};

export type MoodState = "answered" | "unclear" | "declined" | "missing";

export interface DayPoint {
  date: string;
  monthDay: string;
  dayOfMonth: string;
  weekday: string;
  recorded: boolean;
  sleepMinutes: number | null;
  sleepFeeling: SleepFeeling | null;
  exerciseStatus: ExerciseStatus | "missing";
  exerciseMinutes: number | null;
  exerciseSessions: number;
  moodTags: MoodTag[];
  moodState: MoodState;
}

export interface Coverage {
  window: number;
  recorded: number;
  missing: number;
  partial: number;
}

export interface CountItem<K extends string> {
  key: K;
  label: string;
  count: number;
}

export interface SleepSummary {
  nights: number;
  avgMinutes: number | null;
  avgDisplay: string;
  minMinutes: number | null;
  maxMinutes: number | null;
  feelings: CountItem<SleepFeeling>[];
}

export interface ExerciseSummary {
  activeDays: number;
  restDays: number;
  unclearDays: number;
  missingDays: number;
  totalMinutes: number;
  sessions: number;
  avgActiveMinutes: number | null;
}

export interface MoodSummary {
  answeredDays: number;
  unclearDays: number;
  declinedDays: number;
  missingDays: number;
  counts: CountItem<MoodTag>[];
}

export type ComparisonStatus = "ok" | "insufficient";

export interface ComparisonGroup {
  label: string;
  n: number;
  /** 用于画条长度的数值；null 表示没有数据 */
  value: number | null;
  display: string;
}

export interface Comparison {
  id: string;
  title: string;
  hint?: string;
  groups: ComparisonGroup[];
  status: ComparisonStatus;
  conclusion: string | null;
  /** 样本不足时的说明 */
  insufficientNote?: string;
}

export interface TrendsResult {
  range: RangeKey;
  from: string;
  to: string;
  days: DayPoint[];
  coverage: Coverage;
  sleep: SleepSummary;
  exercise: ExerciseSummary;
  mood: MoodSummary;
  comparisons: Comparison[];
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(sum(nums) / nums.length);
}

function toDayPoint(record: CheckinRecord | undefined, date: string): DayPoint {
  const sleepMinutes = record?.sleep
    ? record.sleep.hours * 60 + record.sleep.minutes || null
    : null;

  const status: ExerciseStatus | "missing" = record?.exercise
    ? record.exercise.status
    : "missing";

  const exerciseMinutes =
    record?.exercise && record.exercise.status === "yes"
      ? sum(record.exercise.items.map((item) => item.minutes))
      : null;

  const mood = record?.mood;
  const moodTags = mood?.tags ?? [];
  const moodState: MoodState = !mood
    ? "missing"
    : mood.declined
      ? "declined"
      : mood.unclear
        ? "unclear"
        : moodTags.length > 0
          ? "answered"
          : "missing";

  return {
    date,
    monthDay: monthDay(date),
    dayOfMonth: dayOfMonth(date),
    weekday: weekday(date),
    recorded: Boolean(record?.sleep || record?.exercise || record?.mood),
    sleepMinutes,
    sleepFeeling: record?.sleep?.feeling ?? null,
    exerciseStatus: status,
    exerciseMinutes,
    exerciseSessions:
      record?.exercise?.status === "yes" ? record.exercise.items.length : 0,
    moodTags,
    moodState,
  };
}

function buildSleep(days: DayPoint[]): SleepSummary {
  const values = days
    .map((d) => d.sleepMinutes)
    .filter((v): v is number => v != null);

  const feelings = (Object.keys(FEELING_LABEL) as SleepFeeling[]).map((key) => ({
    key,
    label: FEELING_LABEL[key],
    count: days.filter((d) => d.sleepFeeling === key).length,
  }));

  return {
    nights: values.length,
    avgMinutes: average(values),
    avgDisplay: formatMinutes(average(values)),
    minMinutes: values.length ? Math.min(...values) : null,
    maxMinutes: values.length ? Math.max(...values) : null,
    feelings: feelings.filter((f) => f.count > 0),
  };
}

function buildExercise(days: DayPoint[]): ExerciseSummary {
  const active = days.filter((d) => d.exerciseStatus === "yes");
  const activeMinutes = active
    .map((d) => d.exerciseMinutes)
    .filter((v): v is number => v != null);

  return {
    activeDays: active.length,
    restDays: days.filter((d) => d.exerciseStatus === "no").length,
    unclearDays: days.filter((d) => d.exerciseStatus === "unclear").length,
    missingDays: days.filter((d) => d.exerciseStatus === "missing").length,
    totalMinutes: sum(activeMinutes),
    sessions: sum(active.map((d) => d.exerciseSessions)),
    avgActiveMinutes: average(activeMinutes),
  };
}

function buildMood(days: DayPoint[]): MoodSummary {
  return {
    answeredDays: days.filter((d) => d.moodState === "answered").length,
    unclearDays: days.filter((d) => d.moodState === "unclear").length,
    declinedDays: days.filter((d) => d.moodState === "declined").length,
    missingDays: days.filter((d) => d.moodState === "missing").length,
    counts: MOOD_ORDER.map((key) => ({
      key,
      label: MOOD_LABEL[key],
      count: days.filter((d) => d.moodTags.includes(key)).length,
    })).filter((item) => item.count > 0),
  };
}

function compareExerciseAndSleep(days: DayPoint[]): Comparison {
  const activeSleep = days
    .filter((d) => d.exerciseStatus === "yes" && d.sleepMinutes != null)
    .map((d) => d.sleepMinutes as number);
  const restSleep = days
    .filter((d) => d.exerciseStatus === "no" && d.sleepMinutes != null)
    .map((d) => d.sleepMinutes as number);

  const activeAvg = average(activeSleep);
  const restAvg = average(restSleep);
  const unclearDays = days.filter((d) => d.exerciseStatus === "unclear").length;

  const groups: ComparisonGroup[] = [
    {
      label: "有运动",
      n: activeSleep.length,
      value: activeAvg,
      display: formatMinutes(activeAvg),
    },
    {
      label: "没有运动",
      n: restSleep.length,
      value: restAvg,
      display: formatMinutes(restAvg),
    },
  ];

  const ok =
    activeSleep.length >= MIN_SAMPLE && restSleep.length >= MIN_SAMPLE;

  let conclusion: string | null = null;
  if (ok && activeAvg != null && restAvg != null) {
    const diff = activeAvg - restAvg;
    if (Math.abs(diff) < 10) {
      conclusion = "两组差不多，差别在 10 分钟以内。";
    } else {
      conclusion = `有运动的日子，平均睡眠比没有运动的日子${diff > 0 ? "多" : "少"} ${formatDelta(diff)}。这只是两组数字的差别，不说明谁导致了谁。`;
    }
  }

  return {
    id: "exercise-sleep",
    title: "运动日 vs 没有运动的日子，睡了多久",
    hint: unclearDays
      ? `另有 ${unclearDays} 天选了「记不清」，未计入任一组。`
      : "只比较「有运动」和「没有运动」，两边都要有记录。",
    groups,
    status: ok ? "ok" : "insufficient",
    conclusion,
    insufficientNote: ok
      ? undefined
      : `每边至少需要 ${MIN_SAMPLE} 天有睡眠记录才能比较，现在分别是 ${activeSleep.length} 天和 ${restSleep.length} 天。`,
  };
}

function compareFeelingAndDuration(days: DayPoint[]): Comparison {
  const keys: SleepFeeling[] = ["rested", "neutral", "tired", "unclear"];
  const groups: ComparisonGroup[] = keys
    .map((key) => {
      const values = days
        .filter((d) => d.sleepFeeling === key && d.sleepMinutes != null)
        .map((d) => d.sleepMinutes as number);
      const avg = average(values);
      return {
        label: FEELING_LABEL[key],
        n: values.length,
        value: avg,
        display: formatMinutes(avg),
      };
    })
    .filter((group) => group.n > 0);

  const usable = groups.filter((g) => g.n >= MIN_FEELING_SAMPLE && g.value != null);
  const ok = usable.length >= 2 && sum(usable.map((g) => g.n)) >= 4;

  let conclusion: string | null = null;
  if (ok) {
    const sorted = [...usable].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const high = sorted[0];
    const low = sorted[sorted.length - 1];
    const diff = (high.value ?? 0) - (low.value ?? 0);
    conclusion =
      Math.abs(diff) < 15
        ? `「${high.label}」和「${low.label}」的日子睡得差不多。`
        : `「${high.label}」的日子平均比「${low.label}」多睡 ${formatDelta(diff)}（${high.n} 晚 vs ${low.n} 晚）。`;
  }

  return {
    id: "feeling-duration",
    title: "醒来时不同的感受，前一晚睡了多久",
    hint: "「说不清」单独一组，不和其它感受合并。",
    groups,
    status: ok ? "ok" : "insufficient",
    conclusion,
    insufficientNote: ok
      ? undefined
      : `至少要有两组各 ${MIN_FEELING_SAMPLE} 晚的记录才能对照，现在还不够。`,
  };
}

function compareMoodPairs(days: DayPoint[]): Comparison {
  const pairCount = new Map<string, { tags: MoodTag[]; count: number }>();

  for (const day of days) {
    if (day.moodState !== "answered") continue;
    const unique = Array.from(new Set(day.moodTags)).sort(
      (a, b) => MOOD_ORDER.indexOf(a) - MOOD_ORDER.indexOf(b),
    );
    for (let i = 0; i < unique.length; i += 1) {
      for (let j = i + 1; j < unique.length; j += 1) {
        const key = `${unique[i]}|${unique[j]}`;
        const prev = pairCount.get(key);
        if (prev) prev.count += 1;
        else pairCount.set(key, { tags: [unique[i], unique[j]], count: 1 });
      }
    }
  }

  const ranked = [...pairCount.values()].sort((a, b) => b.count - a.count);
  const top = ranked.slice(0, 3);
  const best = top[0];

  const groups: ComparisonGroup[] = top.map((pair) => ({
    label: `${MOOD_LABEL[pair.tags[0]]} + ${MOOD_LABEL[pair.tags[1]]}`,
    n: pair.count,
    value: pair.count,
    display: `${pair.count} 天`,
  }));

  const ok = Boolean(best && best.count >= MIN_PAIR_DAYS);

  return {
    id: "mood-pairs",
    title: "哪些感受经常出现在同一天",
    hint: "只数同一天被一起选中的次数，不判断这种组合是好是坏。",
    groups,
    status: ok ? "ok" : "insufficient",
    conclusion: ok && best
      ? `「${MOOD_LABEL[best.tags[0]]}」和「${MOOD_LABEL[best.tags[1]]}」有 ${best.count} 天一起出现。`
      : null,
    insufficientNote:
      ok || groups.length === 0
        ? undefined
        : `同一对感受至少要有 ${MIN_PAIR_DAYS} 天一起出现才列出来。`,
  };
}

export function buildTrends(
  records: CheckinRecord[],
  options: { range: RangeKey; today: string },
): TrendsResult {
  const today = options.today;
  const range = options.range;
  const from = addDays(today, -(range - 1));
  const to = today;

  const byDate = new Map(records.map((r) => [r.localDate, r]));
  const days = dateRange(from, to).map((date) =>
    toDayPoint(byDate.get(date), date),
  );

  const recordedDays = days.filter((d) => d.recorded);

  const coverage: Coverage = {
    window: days.length,
    recorded: recordedDays.length,
    missing: days.length - recordedDays.length,
    partial: recordedDays.filter(
      (d) => d.sleepMinutes == null || d.exerciseStatus === "missing" || d.moodState === "missing",
    ).length,
  };

  return {
    range,
    from,
    to,
    days,
    coverage,
    sleep: buildSleep(days),
    exercise: buildExercise(days),
    mood: buildMood(days),
    comparisons: [
      compareExerciseAndSleep(days),
      compareFeelingAndDuration(days),
      compareMoodPairs(days),
    ],
  };
}
