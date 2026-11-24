import type { Metadata } from "next";
import Link from "next/link";
import { OpenPreviewButton } from "@/components/preview-provider";
import { PlaceFrame } from "@/components/place-frame";
import { labels, quietLinkClass } from "@/content/ui";

export const metadata: Metadata = {
  title: "皮肤管理",
};

export default function SkinPage() {
  return (
    <PlaceFrame title="皮肤管理" kicker="皮肤管理">
      <p className="mt-6 text-lg leading-9">
        这里用来慢慢看清自己的皮肤。它是自述，不是诊断，也不定义什么样的皮肤才算好。
      </p>
      <ul className="mt-8 grid gap-4">
        <li className="rounded-lg border border-line bg-paper p-6">
          <h2 className="text-2xl leading-snug">初次皮肤档案</h2>
          <p className="mt-3 leading-relaxed">
            先用几步问题写下目前的困扰、部位和希望。回答只留在这个页面会话里，不会上传。
          </p>
          <OpenPreviewButton className="mt-5">{labels.start}</OpenPreviewButton>
        </li>
        <li className="rounded-lg border border-line bg-paper p-6">
          <h2 className="text-2xl leading-snug">首次记录</h2>
          <p className="mt-3 leading-relaxed">
            按额头、鼻子、左右脸颊和下巴，记下现在已经有的情况。看不清可以标不确定。
          </p>
          <Link href="/first-record" className={`${quietLinkClass} mt-5`}>
            建立我的首次记录
          </Link>
        </li>
      </ul>
    </PlaceFrame>
  );
}
