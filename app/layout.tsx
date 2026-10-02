import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lens & Optics Gallery - Review Assistant",
  description: "Write an honest Google review in your own words.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}