import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteNav } from "@/components/layout/SiteNav";
import { LockButton } from "@/components/layout/LockButton";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Notary CDD & Risk Assessment",
    template: "%s · Notary CDD & Risk Assessment",
  },
  description: "Aplikasi CDD dan Penilaian Tingkat Risiko untuk kantor notaris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <a href="#main-content" className="skip-link">
          Langsung ke konten utama
        </a>
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="font-semibold text-gray-900">
              Notary CDD &amp; Risk Assessment
            </Link>
            <SiteNav />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus:outline-none"
        >
          {children}
        </main>
        <LockButton />
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
