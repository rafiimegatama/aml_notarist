import Link from "next/link";
import {
  Archive,
  Cloud,
  FilePlus2,
  Gauge,
  History,
  Printer,
  ScanLine,
  ShieldQuestion,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/components/detail/DetailPrimitives";

export interface ActivityFeedItem {
  id: string;
  description: string;
  customerId: string;
  customerName: string;
  createdAt: Date;
}

function pickIcon(description: string) {
  const d = description.toLowerCase();
  if (d.includes("ocr")) return ScanLine;
  if (d.includes("edd") || d.includes("risiko tinggi")) return ShieldQuestion;
  if (d.includes("risk") || d.includes("risiko")) return Gauge;
  if (d.includes("backup")) return Archive;
  if (d.includes("drive") || d.includes("sheet")) return Cloud;
  if (d.includes("pdf") || d.includes("cetak")) return Printer;
  if (d.includes("cdd") && d.includes("dibuat")) return FilePlus2;
  return History;
}

export function ActivityTimeline({ items }: { items: ActivityFeedItem[] }) {
  return (
    <div className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
          <History className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Aktivitas Terbaru</h2>
          <p className="mt-1 text-sm font-medium text-muted">Kejadian terbaru di seluruh CDD, terbaru dulu.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={History} title="Belum ada aktivitas" description="Aktivitas akan muncul di sini seiring pemakaian aplikasi." />
        </div>
      ) : (
        <ol className="mt-5 space-y-0">
          {items.map((item, i) => {
            const Icon = pickIcon(item.description);
            const isLast = i === items.length - 1;
            return (
              <li key={item.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && <span className="absolute left-[15px] top-8 h-[calc(100%-1.75rem)] w-px bg-border-subtle" aria-hidden="true" />}
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-slate-800">
                    {item.description}
                    {" — "}
                    <Link href={`/cdd/${item.customerId}`} className="font-semibold text-brand-hover hover:underline">
                      {item.customerName}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted">{formatDate(item.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
