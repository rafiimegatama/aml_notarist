import Link from "next/link";
import { FileSearch2, Scale, Search, Settings } from "lucide-react";

export interface HeroBannerProps {
  imageUrl: string | null;
  greeting: string;
  subtitle: string;
  searchDefaultValue: string;
}

/**
 * Large hero card. When an admin has configured+enabled a background image
 * (Admin > Tampilan), it renders with a dark overlay + blur gradient for
 * text legibility; otherwise falls back to a professional gradient (no
 * cartoon illustrations, per design brief).
 */
export function HeroBanner({ imageUrl, greeting, subtitle, searchDefaultValue }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-soft-lg">
      <div
        className={
          imageUrl
            ? "absolute inset-0 bg-cover bg-center"
            : "absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-hover"
        }
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        aria-hidden="true"
      />
      {imageUrl && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/60 to-slate-900/30 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}
      <div className="bg-watermark-grid absolute inset-0 opacity-[0.06]" aria-hidden="true" />

      <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-9 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              <Scale className="h-3.5 w-3.5" strokeWidth={2} />
              Notary CDD &amp; Risk Assessment
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">{greeting}</h1>
            <p className="mt-1.5 text-sm font-medium text-white/75 sm:text-base">{subtitle}</p>
          </div>
          <Link
            href="/admin/appearance"
            aria-label="Pengaturan tampilan dashboard"
            title="Pengaturan tampilan"
            className="shrink-0 rounded-full bg-white/10 p-2 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
          >
            <Settings className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <form method="get" action="/" className="w-full max-w-xl">
          <label htmlFor="hero-q" className="sr-only">
            Cari CDD, klien, NIK, paspor, perusahaan, atau ID dokumen
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" strokeWidth={2} />
            <input
              id="hero-q"
              name="q"
              defaultValue={searchDefaultValue}
              placeholder="Cari nama, NIK, paspor, NPWP, atau nama perusahaan... (Ctrl+K)"
              className="w-full rounded-2xl border-0 bg-white/95 py-3.5 pl-12 pr-28 text-sm font-medium text-slate-900 shadow-soft-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/70"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-hover"
            >
              <FileSearch2 className="h-3.5 w-3.5" strokeWidth={2} />
              Cari
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
