"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useState } from "react";
import {
  applyMinus,
  applyPlus,
  applyTyped,
  cellInputValue,
  cellStatusLabel,
  countGaps,
  lesionTypes,
  recordAreas,
  toggleUncertain,
  tZoneRollup,
  type AreaId,
  type CellMap,
  type CountCell,
  type LesionId,
} from "@/content/first-record";
import { useRecordDraft, type LocalPhoto } from "@/components/record-draft";
import { labels, primaryButtonClass, quietLinkClass } from "@/content/ui";

const lossNote =
  "刷新或关闭页面后，这次输入可能会丢失。这里没有保存成正式档案。";

function LesionMark({ id }: { id: LesionId }) {
  const common = "h-6 w-6 shrink-0";
  if (id === "closed") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <circle cx="12" cy="12" r="5" fill="none" stroke="#2a1248" strokeWidth="2" />
      </svg>
    );
  }
  if (id === "blackhead") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <circle cx="12" cy="12" r="3.5" fill="#2c2140" />
      </svg>
    );
  }
  if (id === "red") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <circle cx="12" cy="12" r="6" fill="none" stroke="#2a1248" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="#f0c400" />
      </svg>
    );
  }
  if (id === "pustule") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
        <circle cx="12" cy="12" r="6" fill="#efe6d4" stroke="#2a1248" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="#fbfaf6" stroke="#2a1248" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={common}>
      <circle cx="12" cy="12" r="7" fill="none" stroke="#2a1248" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="#2a1248" strokeWidth="2" />
    </svg>
  );
}

function AreaButton({
  id,
  selected,
  onSelect,
}: {
  id: AreaId;
  selected: boolean;
  onSelect: (id: AreaId) => void;
}) {
  const area = recordAreas.find((item) => item.id === id);
  if (!area) return null;
  const side = "side" in area ? area.side : null;
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={
        selected
          ? "flex min-h-16 w-full min-w-0 flex-col items-center justify-center rounded-md border-2 border-purple bg-chip px-2 py-2 text-purple"
          : "flex min-h-16 w-full min-w-0 flex-col items-center justify-center rounded-md border border-line bg-paper px-2 py-2 text-ink"
      }
      onClick={() => onSelect(id)}
    >
      <span aria-hidden="true" className="mb-1 h-1 w-6 bg-yellow" />
      <span className="text-base font-bold leading-snug">{area.label}</span>
      {side ? <span className="text-sm leading-snug">{side}</span> : null}
    </button>
  );
}

function Counter({
  areaLabel,
  lesionId,
  lesionLabel,
  cell,
  onChange,
}: {
  areaLabel: string;
  lesionId: LesionId;
  lesionLabel: string;
  cell: CountCell;
  onChange: (next: CountCell) => void;
}) {
  const inputId = useId();
  const statusId = useId();
  const status = cellStatusLabel(cell);
  return (
    <div
      className="min-w-0 rounded-lg border border-line bg-paper p-3"
      data-record-cell={`${areaLabel}:${lesionLabel}`}
      data-status={cell.kind}
      data-value={cell.kind === "count" ? String(cell.value) : ""}
    >
      <div className="flex items-center gap-2">
        <LesionMark id={lesionId} />
        <span className="font-bold" id={`${inputId}-name`}>
          {lesionLabel}
        </span>
        <span id={statusId} className="ml-auto text-base font-bold text-purple">
          {status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-md bg-purple text-2xl font-bold text-cream"
          aria-label={`${areaLabel}${lesionLabel}减少`}
          onClick={() => onChange(applyMinus(cell))}
        >
          −
        </button>
        <input
          id={inputId}
          aria-labelledby={`${inputId}-name`}
          aria-describedby={statusId}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          placeholder={cell.kind === "uncertain" ? "不确定" : "未填"}
          value={cellInputValue(cell)}
          onChange={(event) => {
            const next = applyTyped(event.target.value);
            if (next) onChange(next);
          }}
          className="h-12 w-20 min-w-0 rounded-md border border-line bg-cream text-center text-2xl font-bold text-ink"
        />
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-md bg-purple text-2xl font-bold text-cream"
          aria-label={`${areaLabel}${lesionLabel}增加`}
          onClick={() => onChange(applyPlus(cell))}
        >
          +
        </button>
        <button
          type="button"
          aria-pressed={cell.kind === "uncertain"}
          aria-label={`${areaLabel}${lesionLabel}不确定`}
          className={
            cell.kind === "uncertain"
              ? "inline-flex min-h-12 items-center rounded-md bg-yellow px-3 font-bold text-purple"
              : "inline-flex min-h-12 items-center rounded-md bg-chip px-3 font-bold text-ink"
          }
          onClick={() => onChange(toggleUncertain(cell))}
        >
          不确定
        </button>
      </div>
    </div>
  );
}

function PhotoPreview({
  photos,
  onRemove,
}: {
  photos: LocalPhoto[];
  onRemove: (id: string) => void;
}) {
  const [urls, setUrls] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    const next = photos.map((photo) => ({
      id: photo.id,
      url: URL.createObjectURL(photo.file),
    }));
    setUrls(next);
    return () => {
      for (const item of next) URL.revokeObjectURL(item.url);
    };
  }, [photos]);

  if (photos.length === 0) return null;
  return (
    <ul className="mt-3 grid gap-3">
      {photos.map((photo) => {
        const url = urls.find((item) => item.id === photo.id)?.url;
        return (
          <li key={photo.id} className="min-w-0 rounded-lg border border-line bg-paper p-3">
            {url ? (
              // Local blob preview only. The object URL is revoked when this list changes.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="max-h-48 w-full rounded-md object-contain"
              />
            ) : null}
            <button
              type="button"
              className={`${quietLinkClass} mt-3 w-full sm:w-auto`}
              onClick={() => onRemove(photo.id)}
            >
              移除这张预览
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function FirstRecord() {
  const { draft, setDraft } = useRecordDraft();
  const area = recordAreas.find((item) => item.id === draft.areaId) ?? recordAreas[0];
  const gaps = countGaps(draft.cells);

  useLayoutEffect(() => {
    if (draft.view !== "summary") return;
    window.scrollTo(0, 0);
  }, [draft.view]);

  const updateCell = (lesionId: LesionId, next: CountCell) => {
    setDraft((current) => ({
      ...current,
      cells: {
        ...current.cells,
        [area.id]: { ...current.cells[area.id], [lesionId]: next },
      },
    }));
  };

  return (
    <>
      <a className="skip-link" href="#record-main">
        {labels.skip}
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center font-bold">
            返回问卷
          </Link>
          <p className="text-base font-bold text-purple">首次记录</p>
        </div>
      </header>
      <main
        id="record-main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl min-w-0 px-5 py-8 sm:px-8 [overflow-anchor:none]"
      >
        <h1 className="max-w-[12em] text-[clamp(1.7rem,4.2vw,3rem)] leading-snug">
          建立我的首次记录
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed">
          只记现在已经有的，不记新长出来的。这不是诊断。看不清可以记不确定。
        </p>
        <p className="mt-3 max-w-3xl rounded-md bg-chip px-4 py-3 font-bold leading-relaxed">
          {lossNote}
        </p>

        {draft.view === "summary" ? (
          <Summary
            cells={draft.cells}
            photoCount={draft.photos.length}
            gaps={gaps}
            onEdit={(areaId) =>
              setDraft((current) => ({ ...current, view: "edit", areaId }))
            }
            onBack={() => setDraft((current) => ({ ...current, view: "edit" }))}
          />
        ) : (
          <>
            <section className="mt-8" aria-labelledby="face-heading">
              <h2 id="face-heading" className="text-[clamp(1.5rem,2.5vw,2rem)] leading-snug">
                选择区域
              </h2>
              <p className="mt-3 leading-relaxed">
                左右以你自己为准：画面左侧是你的左脸颊。
              </p>
              <p className="mt-2 leading-relaxed">
                T 区只汇总额头和鼻子，这里不另填。
              </p>
              <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-3 gap-2">
                <span />
                <AreaButton
                  id="forehead"
                  selected={draft.areaId === "forehead"}
                  onSelect={(areaId) => setDraft((current) => ({ ...current, areaId }))}
                />
                <span />
                <AreaButton
                  id="leftCheek"
                  selected={draft.areaId === "leftCheek"}
                  onSelect={(areaId) => setDraft((current) => ({ ...current, areaId }))}
                />
                <AreaButton
                  id="nose"
                  selected={draft.areaId === "nose"}
                  onSelect={(areaId) => setDraft((current) => ({ ...current, areaId }))}
                />
                <AreaButton
                  id="rightCheek"
                  selected={draft.areaId === "rightCheek"}
                  onSelect={(areaId) => setDraft((current) => ({ ...current, areaId }))}
                />
                <span />
                <AreaButton
                  id="chin"
                  selected={draft.areaId === "chin"}
                  onSelect={(areaId) => setDraft((current) => ({ ...current, areaId }))}
                />
                <span />
              </div>
            </section>

            <section className="mt-10" aria-labelledby="count-heading">
              <h2 id="count-heading" className="text-[clamp(1.5rem,2.5vw,2rem)] leading-snug">
                {area.label}
                {"side" in area ? `（${area.side}）` : ""}
              </h2>
              <p className="mt-3 leading-relaxed">
                未填、明确的 0、不确定是三件不同的事。开始时不会替你填 0。
              </p>
              <div className="mt-4 grid gap-3">
                {lesionTypes.map((lesion) => (
                  <Counter
                    key={lesion.id}
                    areaLabel={area.label}
                    lesionId={lesion.id}
                    lesionLabel={lesion.label}
                    cell={draft.cells[area.id][lesion.id]}
                    onChange={(next) => updateCell(lesion.id, next)}
                  />
                ))}
              </div>
            </section>

            <section className="mt-10" aria-labelledby="photo-heading">
              <h2 id="photo-heading" className="text-[clamp(1.5rem,2.5vw,2rem)] leading-snug">
                照片（自愿）
              </h2>
              <p className="mt-3 leading-relaxed">
                照片只在这台设备的当前页面里预览，不会上传。问卷里的选择不是上传或公开同意。
              </p>
              <label className={`${quietLinkClass} mt-4 cursor-pointer`}>
                添加一张只在本页预览的照片
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setDraft((current) => ({
                      ...current,
                      photos: [
                        ...current.photos,
                        { id: `${Date.now()}-${current.photos.length}`, file },
                      ],
                    }));
                  }}
                />
              </label>
              <PhotoPreview
                photos={draft.photos}
                onRemove={(id) =>
                  setDraft((current) => ({
                    ...current,
                    photos: current.photos.filter((photo) => photo.id !== id),
                  }))
                }
              />
            </section>

            <button
              type="button"
              className={`${primaryButtonClass} mt-10 w-full sm:w-auto`}
              onClick={() => {
                setDraft((current) => ({ ...current, view: "summary" }));
                requestAnimationFrame(() => window.scrollTo(0, 0));
              }}
            >
              完成这次记录
            </button>
          </>
        )}
      </main>
    </>
  );
}

function Summary({
  cells,
  photoCount,
  gaps,
  onEdit,
  onBack,
}: {
  cells: CellMap;
  photoCount: number;
  gaps: { empty: number; uncertain: number };
  onEdit: (areaId: AreaId) => void;
  onBack: () => void;
}) {
  return (
    <section className="mt-8" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-[clamp(1.5rem,2.5vw,2rem)] leading-snug">
        这次记下的
      </h2>
      <p className="mt-3 font-bold leading-relaxed">
        {gaps.empty > 0 || gaps.uncertain > 0
          ? `还有未填 ${gaps.empty} 处、不确定 ${gaps.uncertain} 处。可以回去改，也可以先停在这里。`
          : "每个格子都有明确个数。这仍然只是这次页面里的记录。"}
      </p>
      <div className="mt-5 grid gap-4">
        {recordAreas.map((item) => (
          <article key={item.id} className="min-w-0 rounded-lg border border-line bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl leading-snug">
                {item.label}
                {"side" in item ? `（${item.side}）` : ""}
              </h3>
              <button type="button" className={quietLinkClass} onClick={() => onEdit(item.id)}>
                修改此处
              </button>
            </div>
            <ul className="mt-3 grid gap-2">
              {lesionTypes.map((lesion) => {
                const cell = cells[item.id][lesion.id];
                return (
                  <li key={lesion.id} className="flex min-w-0 items-center justify-between gap-3">
                    <span>{lesion.label}</span>
                    <span className="font-bold text-purple">{cellStatusLabel(cell)}</span>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
      <article className="mt-4 min-w-0 rounded-lg border border-line bg-chip p-4">
        <h3 className="text-2xl leading-snug">T 区（额头 + 鼻子）</h3>
        <p className="mt-2 leading-relaxed">不另填写。未填或不确定不会被当成 0 相加。</p>
        <ul className="mt-3 grid gap-2">
          {lesionTypes.map((lesion) => {
            const rollup = tZoneRollup(cells.forehead[lesion.id], cells.nose[lesion.id]);
            return (
              <li key={lesion.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span>{lesion.label}</span>
                <span className="font-bold text-purple" data-tzone={lesion.label}>
                  {rollup.kind === "sum" ? `合计 ${rollup.value}` : rollup.notes.join("，")}
                </span>
              </li>
            );
          })}
        </ul>
      </article>
      {photoCount > 0 ? (
        <p className="mt-4 leading-relaxed">
          本页有 {photoCount} 张本地预览，没有上传。
        </p>
      ) : null}
      <button type="button" className={`${primaryButtonClass} mt-6 w-full sm:w-auto`} onClick={onBack}>
        返回修改
      </button>
    </section>
  );
}
