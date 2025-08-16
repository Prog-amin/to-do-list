import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartTodos - AI-Powered Task Management",
  description: "Intelligent task management with AI-powered features including task prioritization, deadline suggestions, and context-aware recommendations.",
  keywords: ["task management", "AI", "productivity", "todo", "smart"],
  authors: [{ name: "SmartTodos Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
