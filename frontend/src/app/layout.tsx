import type { Metadata, Viewport } from "next";
import Providers from "./providers";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "../styles.css";

export const metadata: Metadata = {
  title: "TrafficOS — Event-Driven Traffic Intelligence",
  description:
    "Forecast event-driven congestion and optimize police deployment for Bengaluru in real time.",
  openGraph: {
    title: "TrafficOS — Smart City Traffic Intelligence",
    description: "AI-powered traffic impact forecasting and resource optimization platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#07111F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="dark bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
