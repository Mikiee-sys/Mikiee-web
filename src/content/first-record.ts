/** Session-only first record. Counts are never defaulted to zero. */

export const recordAreas = [
  { id: "forehead", label: "额头" },
  { id: "nose", label: "鼻子" },
  { id: "leftCheek", label: "左脸颊", side: "你的左侧" },
  { id: "rightCheek", label: "右脸颊", side: "你的右侧" },
  { id: "chin", label: "下巴" },
] as const;

export const lesionTypes = [
  { id: "closed", label: "闭口" },
  { id: "blackhead", label: "黑头" },
  { id: "red", label: "红肿痘" },
  { id: "pustule", label: "脓包痘" },
  { id: "cyst", label: "囊肿痘" },
] as const;

export type AreaId = (typeof recordAreas)[number]["id"];
export type LesionId = (typeof lesionTypes)[number]["id"];

export type CountCell =
  | { kind: "empty" }
  | { kind: "uncertain" }
  | { kind: "count"; value: number };

export const COUNT_MAX = 999;

export type CellMap = Record<AreaId, Record<LesionId, CountCell>>;

export function emptyCells(): CellMap {
  const cells = {} as CellMap;
  for (const area of recordAreas) {
    cells[area.id] = {} as Record<LesionId, CountCell>;
    for (const lesion of lesionTypes) {
      cells[area.id][lesion.id] = { kind: "empty" };
    }
  }
  return cells;
}

export function cellInputValue(cell: CountCell): string {
  return cell.kind === "count" ? String(cell.value) : "";
}

export function cellStatusLabel(cell: CountCell): string {
  if (cell.kind === "empty") return "未填";
  if (cell.kind === "uncertain") return "不确定";
  return cell.value === 0 ? "明确记为 0" : `已记为 ${cell.value}`;
}

/** Reject the keystroke by returning null. Empty, explicit 0, and other integers stay distinct. */
export function applyTyped(raw: string): CountCell | null {
  const trimmed = raw.trim();
  if (trimmed === "") return { kind: "empty" };
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value > COUNT_MAX) return null;
  return { kind: "count", value };
}

export function applyMinus(cell: CountCell): CountCell {
  if (cell.kind !== "count") return cell;
  if (cell.value <= 0) return { kind: "count", value: 0 };
  return { kind: "count", value: cell.value - 1 };
}

export function applyPlus(cell: CountCell): CountCell {
  if (cell.kind === "uncertain" || cell.kind === "empty") {
    return { kind: "count", value: 1 };
  }
  if (cell.value >= COUNT_MAX) return cell;
  return { kind: "count", value: cell.value + 1 };
}

export function toggleUncertain(cell: CountCell): CountCell {
  if (cell.kind === "uncertain") return { kind: "empty" };
  return { kind: "uncertain" };
}

export type ZoneRollup =
  | { kind: "sum"; value: number }
  | { kind: "incomplete"; notes: string[] };

export function tZoneRollup(forehead: CountCell, nose: CountCell): ZoneRollup {
  const notes: string[] = [];
  if (forehead.kind === "empty") notes.push("额头未填");
  if (forehead.kind === "uncertain") notes.push("额头不确定");
  if (nose.kind === "empty") notes.push("鼻子未填");
  if (nose.kind === "uncertain") notes.push("鼻子不确定");
  if (notes.length > 0) return { kind: "incomplete", notes };
  return {
    kind: "sum",
    value: (forehead as { kind: "count"; value: number }).value +
      (nose as { kind: "count"; value: number }).value,
  };
}

export function countGaps(cells: CellMap): { empty: number; uncertain: number } {
  let empty = 0;
  let uncertain = 0;
  for (const area of recordAreas) {
    for (const lesion of lesionTypes) {
      const cell = cells[area.id][lesion.id];
      if (cell.kind === "empty") empty += 1;
      if (cell.kind === "uncertain") uncertain += 1;
    }
  }
  return { empty, uncertain };
}
