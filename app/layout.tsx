import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-gray-900">
              Notary CDD &amp; Risk Assessment
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/cdd/new" className="hover:text-gray-900">
                Buat CDD Baru
              </Link>
              <Link href="/admin/referensi" className="hover:text-gray-900">
                Referensi Data
              </Link>
              <Link href="/admin/backup" className="hover:text-gray-900">
                Backup Data
              </Link>
              <Link href="/admin/retensi" className="hover:text-gray-900">
                Retensi Data
              </Link>
              <Link href="/admin/ltkm" className="hover:text-gray-900">
                Laporan LTKM
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
