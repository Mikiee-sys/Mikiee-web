import type { Metadata } from "next";
import { PlaceFrame } from "@/components/place-frame";

export const metadata: Metadata = {
  title: "社区分享",
};

export default function CommunityPage() {
  return (
    <PlaceFrame title="社区分享" kicker="社区分享">
      <p className="mt-6 text-lg leading-9">这一页先留作跳转。正式记录以后再做。</p>
    </PlaceFrame>
  );
}
