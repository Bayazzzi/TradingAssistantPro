import type { Metadata, Viewport } from "next";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Trading Assistant Pro",
  description:
    "A trader's cockpit: live FX sessions & countdowns, market quotes, economic calendar, risk & position-size calculators, discipline checklist and a trade journal.",
  keywords: ["trading", "forex", "sessions", "position size", "risk", "economic calendar", "trade journal"],
  authors: [{ name: "Trading Assistant Pro" }],
  openGraph: {
    title: "Trading Assistant Pro",
    description: "The trader's cockpit — sessions, quotes, calendar, risk tools and journal.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Set the theme attribute before paint to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
