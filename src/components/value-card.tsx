import { splitValue, valueEnglish } from "@/content/original";
import { labels } from "@/content/ui";

function BilingualTitle({ title, english }: { title: string; english: string }) {
  const at = title.indexOf(english);
  if (at === -1) return title;
  return (
    <>
      {title.slice(0, at)}
      <span lang="en">{english}</span>
      {title.slice(at + english.length)}
    </>
  );
}

export function ValueCard({
  text,
  english,
  index,
}: {
  text: string;
  english: (typeof valueEnglish)[number];
  index: number;
}) {
  const { title, lead, rest } = splitValue(text);
  const panelId = `value-panel-${index}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-paper">
      <div aria-hidden="true" className="h-1 bg-purple" />
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-2xl leading-snug">
          <BilingualTitle title={title} english={english} />
        </h3>
        <p className="mt-3 leading-relaxed">{lead}</p>
        <details className="fulltext mt-auto pt-4">
          <summary
            aria-controls={panelId}
            className="flex min-h-11 cursor-pointer items-center rounded-md bg-chip px-4 text-base font-bold"
          >
            <span className="sr-only">{title}</span>
            <span className="when-closed">{labels.expand}</span>
            <span className="when-open">{labels.collapse}</span>
          </summary>
          <p
            id={panelId}
            className="mt-4 border-t border-line pt-4 leading-relaxed whitespace-pre-line"
          >
            {rest}
          </p>
        </details>
      </div>
    </article>
  );
}
