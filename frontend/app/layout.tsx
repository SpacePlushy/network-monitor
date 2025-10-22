import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Network Monitor",
  description: "Real-time network connection and bandwidth monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-900">
        {children}
      </body>
    </html>
  );
}
