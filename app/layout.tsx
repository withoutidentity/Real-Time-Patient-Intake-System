import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Intake",
  description: "Real-time patient intake form and staff dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
