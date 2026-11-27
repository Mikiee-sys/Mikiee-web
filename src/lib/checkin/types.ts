/** 睡眠、运动、心情的日记录。三个区块都可以为空，缺失不等于 0。 */

export type SleepFeeling = "rested" | "neutral" | "tired" | "unclear";

export type ExerciseStatus = "yes" | "no" | "unclear";

export type MoodTag = "calm" | "happy" | "anxious" | "low" | "irritable" | "other";

export type ExerciseIntensity = "easy" | "moderate" | "hard" | "unknown";

export interface ExerciseItem {
  type: string;
  minutes: number;
  intensity: ExerciseIntensity;
}

export interface SleepEntry {
  /** 这一觉对应的夜晚，例如 2026-11-24 表示 24 日晚入睡 */
  night: string;
  hours: number;
  minutes: number;
  feeling?: SleepFeeling;
}

export interface ExerciseEntry {
  status: ExerciseStatus;
  items: ExerciseItem[];
}

export interface MoodEntry {
  tags: MoodTag[];
  /** 说不清：单独状态，与 tags 互斥 */
  unclear?: boolean;
  /** 暂不回答：单独状态，与 tags 互斥 */
  declined?: boolean;
}

export interface CheckinRecord {
  localDate: string;
  sleep?: SleepEntry | null;
  exercise?: ExerciseEntry | null;
  mood?: MoodEntry | null;
}
