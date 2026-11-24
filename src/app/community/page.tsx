import type { Metadata } from "next";
import { PlaceFrame } from "@/components/place-frame";

export const metadata: Metadata = {
  title: "社区分享",
};

export default function CommunityPage() {
  return (
    <PlaceFrame title="社区分享" kicker="社区分享">
      <p className="mt-6 text-lg leading-9">
        社区还在规划。你的记录默认只属于你。以后如果想分享，可以按自己的节奏来，也可以先不决定。
      </p>
      <div className="mt-8 space-y-6 rounded-lg border border-line border-l-4 border-l-purple bg-paper p-6 sm:p-8">
        <p className="text-lg leading-9">
          这里现在没有帖子、评论或公开动态。来到这一页，不等于同意把皮肤档案或照片公开。
        </p>
        <p className="text-lg leading-9">
          若以后开放分享，也只会按你当次选出的内容，并需要你自己确认。匿名只是对其他成员少暴露身份，不是对平台完全不可见。
        </p>
        <p className="text-lg leading-9">先把自己看清楚，就已经很好。不着急。</p>
      </div>
    </PlaceFrame>
  );
}
