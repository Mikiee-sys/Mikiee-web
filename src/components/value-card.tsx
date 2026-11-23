import { splitValue, valueEnglish } from "@/content/original";

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
}: {
  text: string;
  english: (typeof valueEnglish)[number];
}) {
  const { title, lead, rest } = splitValue(text);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-paper">
      <div aria-hidden="true" className="h-1 bg-purple" />
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-2xl leading-snug">
          <BilingualTitle title={title} english={english} />
        </h3>
        <p className="mt-3 leading-relaxed">{lead}</p>
        {rest ? (
          <p className="mt-4 leading-relaxed whitespace-pre-line">{rest}</p>
        ) : null}
      </div>
    </article>
  );
}
