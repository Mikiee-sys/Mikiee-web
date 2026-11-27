import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { mission, slogan } from "@/content/original";
import { CheckinSessionProvider } from "@/components/checkin-session";
import { PreviewProvider } from "@/components/preview-provider";
import { RecordDraftProvider } from "@/components/record-draft";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../fonts/noto-sans-sc-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-sans-sc-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-app-sans",
  fallback: [
    "PingFang SC",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    "WenQuanYi Micro Hei",
    "sans-serif",
  ],
  adjustFontFallback: false,
});

const serif = localFont({
  src: "../fonts/noto-serif-sc-700.woff2",
  weight: "700",
  display: "swap",
  variable: "--font-app-serif",
  fallback: ["Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", "serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: slogan,
  description: mission,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3eee4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hans" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full bg-cream font-sans text-ink antialiased">
        <RecordDraftProvider>
          <CheckinSessionProvider>
            <PreviewProvider>{children}</PreviewProvider>
          </CheckinSessionProvider>
        </RecordDraftProvider>
      </body>
    </html>
  );
}
