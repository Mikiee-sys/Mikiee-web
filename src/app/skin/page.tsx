import type { Metadata } from "next";
import { PlaceFrame } from "@/components/place-frame";

export const metadata: Metadata = {
  title: "皮肤管理",
};

export default function SkinPage() {
  return (
    <PlaceFrame title="皮肤管理" kicker="皮肤管理">
      <p className="mt-6 text-lg leading-9">这一页先留作跳转。正式记录以后再做。</p>
    </PlaceFrame>
  );
}
