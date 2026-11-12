import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Made with App Studio",
  description:
    "CT POOL: game tambang token virtual. Ketuk untuk menambang, upgrade alat tambang, dan klaim bonus harian.",
    generator: 'v0.app'
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12141f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${GeistSans.variable} ${GeistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
