import type { Metadata } from "next";
import { CheckinForm } from "@/components/checkin-form";

export const metadata: Metadata = {
  title: "睡眠、运动与心情",
};

export default function CheckinPage() {
  return <CheckinForm />;
}
