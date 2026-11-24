import type { Metadata } from "next";
import { FirstRecord } from "@/components/first-record";

export const metadata: Metadata = {
  title: "建立我的首次记录",
};

export default function FirstRecordPage() {
  return <FirstRecord />;
}
