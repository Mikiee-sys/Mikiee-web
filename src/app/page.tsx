import { OpenPreviewButton } from "@/components/preview-provider";
import { ValueCard } from "@/components/value-card";
import {
  mission,
  philosophy,
  slogan,
  valueEnglish,
  valueTexts,
} from "@/content/original";
import { labels, quietLinkClass, stages } from "@/content/ui";

export default function Home() {
  const comma = slogan.indexOf("，");
  const sloganLines =
    comma === -1
      ? [slogan]
      : [slogan.slice(0, comma + 1), slogan.slice(comma + 1)];

  return (
    <>
      <a className="skip-link" href="#main">
        {labels.skip}
      </a>
      <header
        id="top"
        className="sticky top-0 z-30 border-b border-line bg-cream"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3 sm:px-8">
          <a
            href="#top"
            aria-label={labels.top}
            className="order-1 inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full"
          >
            <span aria-hidden="true" className="size-3 bg-yellow" />
            <span aria-hidden="true" className="size-3 bg-purple" />
          </a>
          <nav
            aria-label={labels.nav}
            className="order-3 flex w-full items-center sm:order-2 sm:w-auto sm:flex-1"
          >
            <a
              href="#values"
              className="inline-flex min-h-11 items-center rounded-full px-3 font-bold"
            >
              {labels.values}
            </a>
            <a
              href="#philosophy"
              className="inline-flex min-h-11 items-center rounded-full px-3 font-bold"
            >
              {labels.philosophy}
            </a>
            <a
              href="#next"
              className="inline-flex min-h-11 items-center rounded-full px-3 font-bold"
            >
              {labels.next}
            </a>
          </nav>
          <OpenPreviewButton className="order-2 shrink-0 sm:order-3">
            {labels.start}
          </OpenPreviewButton>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <section
          className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:py-28"
          aria-labelledby="hero-heading"
        >
          <p className="max-w-3xl text-lg leading-9">{mission}</p>
          <div className="mt-8 max-w-3xl">
            <h1
              id="hero-heading"
              className="max-w-[12em] text-[clamp(1.7rem,4.2vw,3.5rem)] leading-[1.28]"
            >
              {sloganLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <div aria-hidden="true" className="mt-7 h-1 w-12 bg-yellow" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <OpenPreviewButton className="w-full sm:w-auto">
                {labels.start}
              </OpenPreviewButton>
              <a
                href="#philosophy"
                className={`${quietLinkClass} w-full sm:w-auto`}
              >
                {labels.philosophy}
              </a>
            </div>
          </div>
        </section>

        <section
          id="values"
          aria-labelledby="values-heading"
          className="px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="values-heading"
              className="text-[clamp(1.75rem,2.5vw,2.5rem)] leading-snug"
            >
              {labels.values}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
              {valueTexts.map((text, index) => (
                <div
                  key={text}
                  className={
                    index === 3
                      ? "sm:col-span-1 lg:col-span-2 lg:col-start-2"
                      : index === 4
                        ? "sm:col-span-2 lg:col-span-2"
                        : "lg:col-span-2"
                  }
                >
                  <ValueCard text={text} english={valueEnglish[index]} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="philosophy"
          aria-labelledby="philosophy-heading"
          className="bg-[#ebe4d6] px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="philosophy-heading"
              className="text-[clamp(1.75rem,2.5vw,2.5rem)] leading-snug"
            >
              {labels.philosophy}
            </h2>
            <div className="mt-8 space-y-7 border-y border-r border-line border-l-4 border-l-purple bg-paper p-7 sm:p-12">
              {philosophy.map((paragraph) => (
                <p key={paragraph} className="text-lg leading-9">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section
          id="next"
          aria-labelledby="next-heading"
          className="px-5 py-16 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="next-heading"
              className="text-[clamp(1.75rem,2.5vw,2.5rem)] leading-snug"
            >
              {labels.next}
            </h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage, index) => (
                <li
                  key={stage}
                  className="rounded-lg border border-line bg-paper p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-11 place-items-center rounded-full bg-yellow text-lg font-bold text-purple"
                    >
                      {index + 1}
                    </span>
                    <span className="rounded-full bg-chip px-3 py-1 text-base font-bold">
                      {labels.building}
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-bold leading-snug">{stage}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <OpenPreviewButton>{labels.start}</OpenPreviewButton>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="mx-auto flex max-w-6xl justify-start">
          <a href="#top" className="inline-flex min-h-11 items-center font-bold">
            {labels.top}
          </a>
        </div>
      </footer>
    </>
  );
}
