import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { LockButton } from "@/components/layout/LockButton";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { ToastProvider } from "@/components/ui/toast";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SessionExpiryWarning } from "@/components/layout/SessionExpiryWarning";
import { IdleLockTimer } from "@/components/layout/IdleLockTimer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        <a href="#main-content" className="skip-link">
          Langsung ke konten utama
        </a>
        <ToastProvider>
          <OfflineBanner />
          <div className="flex min-h-screen flex-col lg:flex-row">
            <Sidebar />
            <main
              id="main-content"
              tabIndex={-1}
              className="min-w-0 flex-1 px-4 py-8 focus:outline-none sm:px-6 lg:px-10 lg:py-10"
            >
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
          <LockButton />
          <KeyboardShortcuts />
          <SessionExpiryWarning />
          <IdleLockTimer />
        </ToastProvider>
      </body>
    </html>
  );
}
