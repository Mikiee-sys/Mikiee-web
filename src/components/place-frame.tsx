import Link from "next/link";
import type { ReactNode } from "react";
import { labels } from "@/content/ui";

export function PlaceFrame({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#place-main">
        {labels.skip}
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/#next" className="inline-flex min-h-11 items-center font-bold">
            返回后续页面
          </Link>
          <p className="text-base font-bold text-purple">{kicker}</p>
        </div>
      </header>
      <main
        id="place-main"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16"
      >
        <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-snug">{title}</h1>
        {children}
      </main>
    </>
  );
}
