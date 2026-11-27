import { addDays, daysBetween, todayInTz } from "./date";
import type {
  CheckinRecord,
  ExerciseIntensity,
  ExerciseItem,
  ExerciseStatus,
  MoodTag,
  SleepFeeling,
} from "./types";

/**
 * 手写校验，不引 zod：规则本身不复杂，但三态语义必须写死在这里，
 * 不能靠前端“看起来是对的”。
 */

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationOutcome =
  | { ok: true; record: CheckinRecord }
  | { ok: false; errors: FieldError[] };

const SLEEP_FEELINGS: SleepFeeling[] = ["rested", "neutral", "tired", "unclear"];
const EXERCISE_STATUSES: ExerciseStatus[] = ["yes", "no", "unclear"];
const INTENSITIES: ExerciseIntensity[] = ["easy", "moderate", "hard", "unknown"];
const MOOD_TAGS: MoodTag[] = [
  "calm",
  "happy",
  "anxious",
  "low",
  "irritable",
  "other",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 12;
const MAX_ITEM_MINUTES = 600;
const MAX_DAY_MINUTES = 24 * 60;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time)) return false;
  // 排除 2026-02-30 这类“格式对但不存在”的日期
  return new Date(time).toISOString().slice(0, 10) === value;
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

function isEnum<T extends string>(value: unknown, all: readonly T[]): value is T {
  return typeof value === "string" && (all as readonly string[]).includes(value);
}

export function validateCheckinPayload(input: unknown): ValidationOutcome {
  const errors: FieldError[] = [];

  if (!isObject(input)) {
    return { ok: false, errors: [{ field: "body", message: "请求体需要是 JSON 对象" }] };
  }

  const today = todayInTz();
  const localDate = typeof input.localDate === "string" ? input.localDate.trim() : "";

  if (!isValidDate(localDate)) {
    errors.push({ field: "localDate", message: "localDate 需要是 YYYY-MM-DD" });
  } else if (localDate > today) {
    errors.push({ field: "localDate", message: "不能记录未来的一天" });
  }

  /* ---------- 睡眠 ---------- */
  let sleep: CheckinRecord["sleep"] = null;

  if (input.sleep != null) {
    const raw = isObject(input.sleep) ? input.sleep : null;
    if (!raw) {
      errors.push({ field: "sleep", message: "sleep 需要是对象或 null" });
    } else {
      const hours = toInt(raw.hours);
      const minutes = toInt(raw.minutes);

      if (hours == null || hours < 0 || hours > 24) {
        errors.push({ field: "sleep.hours", message: "小时需要是 0–24 的整数" });
      }
      if (minutes == null || minutes < 0 || minutes > 59) {
        errors.push({ field: "sleep.minutes", message: "分钟需要是 0–59 的整数" });
      }

      const total = (hours ?? 0) * 60 + (minutes ?? 0);
      if (hours != null && minutes != null && (total <= 0 || total > MAX_DAY_MINUTES)) {
        errors.push({ field: "sleep", message: "实际睡眠时长需要在 1 分钟到 24 小时之间" });
      }

      let night = localDate;
      if (raw.night != null) {
        if (typeof raw.night !== "string" || !isValidDate(raw.night)) {
          errors.push({ field: "sleep.night", message: "night 需要是 YYYY-MM-DD" });
        } else {
          night = raw.night;
        }
      } else if (isValidDate(localDate)) {
        night = addDays(localDate, -1);
      }

      if (isValidDate(localDate) && isValidDate(night)) {
        const gap = daysBetween(night, localDate);
        if (gap < 0) {
          errors.push({ field: "sleep.night", message: "这一晚不能晚于记录日期" });
        } else if (gap > 2) {
          errors.push({ field: "sleep.night", message: "这一晚和记录日期相差太远" });
        }
      }

      let feeling: SleepFeeling | undefined;
      if (raw.feeling != null) {
        if (isEnum(raw.feeling, SLEEP_FEELINGS)) feeling = raw.feeling;
        else errors.push({ field: "sleep.feeling", message: "醒来感受的取值不合法" });
      }

      if (hours != null && minutes != null && total > 0 && total <= MAX_DAY_MINUTES) {
        sleep = { night, hours, minutes, ...(feeling ? { feeling } : {}) };
      }
    }
  }

  /* ---------- 运动 ---------- */
  let exercise: CheckinRecord["exercise"] = null;

  if (input.exercise != null) {
    const raw = isObject(input.exercise) ? input.exercise : null;
    if (!raw) {
      errors.push({ field: "exercise", message: "exercise 需要是对象或 null" });
    } else if (!isEnum(raw.status, EXERCISE_STATUSES)) {
      errors.push({
        field: "exercise.status",
        message: "运动状态只能是 yes / no / unclear",
      });
    } else {
      const status = raw.status;

      if (status !== "yes") {
        // 没运动或记不清时，条目一律清空，避免残留上一次的数据
        exercise = { status, items: [] };
      } else {
        const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
        if (itemsRaw.length === 0) {
          errors.push({ field: "exercise.items", message: "选了「有运动」至少要填一次运动" });
        }
        if (itemsRaw.length > MAX_ITEMS) {
          errors.push({ field: "exercise.items", message: `一次最多记 ${MAX_ITEMS} 条` });
        }

        const items: ExerciseItem[] = [];
        itemsRaw.slice(0, MAX_ITEMS).forEach((entry, index) => {
          if (!isObject(entry)) {
            errors.push({ field: `exercise.items[${index}]`, message: "运动条目格式不对" });
            return;
          }

          const type = typeof entry.type === "string" ? entry.type.trim() : "";
          if (type.length === 0 || type.length > 20) {
            errors.push({
              field: `exercise.items[${index}].type`,
              message: "运动名称需要 1–20 个字",
            });
          }

          const minutes = toInt(entry.minutes);
          if (minutes == null || minutes <= 0 || minutes > MAX_ITEM_MINUTES) {
            errors.push({
              field: `exercise.items[${index}].minutes`,
              message: `单次时长需要 1–${MAX_ITEM_MINUTES} 分钟`,
            });
          }

          if (!isEnum(entry.intensity, INTENSITIES)) {
            errors.push({
              field: `exercise.items[${index}].intensity`,
              message: "强度取值不合法",
            });
          }

          if (type && minutes != null && minutes > 0) {
            items.push({
              type,
              minutes,
              intensity: isEnum(entry.intensity, INTENSITIES) ? entry.intensity : "unknown",
            });
          }
        });

        const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
        if (totalMinutes > MAX_DAY_MINUTES) {
          errors.push({ field: "exercise.items", message: "当天运动总时长超过 24 小时" });
        }

        if (items.length > 0) exercise = { status: "yes", items };
      }
    }
  }

  /* ---------- 心情 ---------- */
  let mood: CheckinRecord["mood"] = null;

  if (input.mood != null) {
    const raw = isObject(input.mood) ? input.mood : null;
    if (!raw) {
      errors.push({ field: "mood", message: "mood 需要是对象或 null" });
    } else {
      const tagsRaw = raw.tags == null ? [] : raw.tags;
      if (!Array.isArray(tagsRaw)) {
        errors.push({ field: "mood.tags", message: "tags 需要是数组" });
      }

      const tags = Array.isArray(tagsRaw) ? tagsRaw : [];
      const invalid = tags.filter((tag) => !isEnum(tag, MOOD_TAGS));
      if (invalid.length > 0) {
        errors.push({ field: "mood.tags", message: "存在不认识的心情标签" });
      }
      if (tags.length > MOOD_TAGS.length) {
        errors.push({ field: "mood.tags", message: "标签数量超出上限" });
      }

      const uniqueTags = Array.from(new Set(tags.filter((tag) => isEnum(tag, MOOD_TAGS))));
      const unclear = raw.unclear === true;
      const declined = raw.declined === true;

      if (unclear && declined) {
        errors.push({ field: "mood", message: "「说不清」和「暂不回答」只能选一个" });
      }
      if ((unclear || declined) && uniqueTags.length > 0) {
        errors.push({ field: "mood", message: "这两个选项不能和具体感受同时选" });
      }

      if (!unclear && !declined && uniqueTags.length > 0) {
        mood = { tags: uniqueTags };
      } else if (unclear || declined) {
        mood = { tags: [], ...(unclear ? { unclear: true } : { declined: true }) };
      }
      // 什么都没选：mood 保持 null，表示未填写，而不是「没有情绪」
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    record: {
      localDate,
      sleep,
      exercise,
      mood,
    },
  };
}
