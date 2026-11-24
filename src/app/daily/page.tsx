import type { Metadata } from "next";
import { PlaceFrame } from "@/components/place-frame";

export const metadata: Metadata = {
  title: "日常生活",
};

export default function DailyPage() {
  return (
    <PlaceFrame title="日常生活" kicker="日常生活">
      <p className="mt-6 text-lg leading-9">这一页先留作跳转。正式记录以后再做。</p>
    </PlaceFrame>
  );
}
