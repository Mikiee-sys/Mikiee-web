import type { Metadata } from "next";
import { TrendsView } from "@/components/trends-view";

export const metadata: Metadata = {
  title: "趋势与对照",
};

export default function TrendsPage() {
  return <TrendsView />;
}
