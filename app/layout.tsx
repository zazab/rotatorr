import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TV Series Rotation",
  description: "Track Plex collection rotation based on Tautulli play history."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
