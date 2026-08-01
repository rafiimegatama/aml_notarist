import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  CustomerType,
  CustomerStatus,
  RiskCategory,
} from "@/lib/generated/prisma/enums";
import {
  customerTypeLabels,
  customerStatusLabels,
  riskCategoryLabels,
  labelOptions,
} from "@/lib/labels";
import { formatDate } from "@/components/detail/DetailPrimitives";
import { ScanUploadPanel } from "@/components/upload/ScanUploadPanel";

const typeOptions = labelOptions(customerTypeLabels);
const statusOptions = labelOptions(customerStatusLabels);
const riskCategoryOptions = labelOptions(riskCategoryLabels);

function firstOrUndefined(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = firstOrUndefined(sp.q)?.trim() || undefined;
  const type = firstOrUndefined(sp.type) || undefined;
  const status = firstOrUndefined(sp.status) || undefined;
  const riskCategory = firstOrUndefined(sp.riskCategory) || undefined;
  const dateFrom = firstOrUndefined(sp.dateFrom) || undefined;
  const dateTo = firstOrUndefined(sp.dateTo) || undefined;

  const where: Prisma.CustomerWhereInput = {};
  if (type && (Object.values(CustomerType) as string[]).includes(type)) {
    where.type = type as CustomerType;
  }
  if (status && (Object.values(CustomerStatus) as string[]).includes(status)) {
    where.status = status as CustomerStatus;
  }
  if (
    riskCategory &&
    (Object.values(RiskCategory) as string[]).includes(riskCategory)
  ) {
    where.riskAssessment = { riskCategory: riskCategory as RiskCategory };
  }
  const validDateFrom = dateFrom && !Number.isNaN(Date.parse(dateFrom)) ? dateFrom : undefined;
  const validDateTo = dateTo && !Number.isNaN(Date.parse(dateTo)) ? dateTo : undefined;
  if (validDateFrom || validDateTo) {
    where.createdAt = {
      gte: validDateFrom ? new Date(validDateFrom) : undefined,
      lte: validDateTo ? new Date(`${validDateTo}T23:59:59.999`) : undefined,
    };
  }
  if (q) {
    where.OR = [
      { corporateDetail: { namaKorporasi: { contains: q } } },
      { individualDetail: { namaLengkap: { contains: q } } },
      { legalArrangementDetail: { nama: { contains: q } } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
      riskAssessment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const hasFilters = !!(q || type || status || riskCategory || dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {customers.length} CDD ditemukan.
          </p>
        </div>
        <Link
          href="/cdd/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Buat CDD Baru
        </Link>
      </div>

      <ScanUploadPanel />

      <form
        method="get"
        className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <label htmlFor="q" className="block text-xs font-medium text-gray-500">
            Cari nama
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nama pengguna jasa..."
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-gray-500">
            Tipe
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="riskCategory" className="block text-xs font-medium text-gray-500">
            Kategori Risiko
          </label>
          <select
            id="riskCategory"
            name="riskCategory"
            defaultValue={riskCategory ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            {riskCategoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-500">
            Dari Tanggal
          </label>
          <input
            id="dateFrom"
            name="dateFrom"
            type="date"
            defaultValue={dateFrom ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="dateTo" className="block text-xs font-medium text-gray-500">
            Sampai Tanggal
          </label>
          <input
            id="dateTo"
            name="dateTo"
            type="date"
            defaultValue={dateTo ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-6">
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Terapkan Filter
          </button>
          {hasFilters && (
            <Link
              href="/"
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Tipe</th>
              <th className="px-4 py-3 font-medium">Kategori Risiko</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tanggal Dibuat</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const name =
                c.corporateDetail?.namaKorporasi ??
                c.individualDetail?.namaLengkap ??
                c.legalArrangementDetail?.nama ??
                "(tanpa nama)";
              const category = c.riskAssessment?.riskCategory;
              return (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {customerTypeLabels[c.type]}
                  </td>
                  <td className="px-4 py-3">
                    {category ? (
                      <span
                        className={
                          category === "TINGGI"
                            ? "font-medium text-red-700"
                            : category === "SEDANG"
                              ? "font-medium text-amber-700"
                              : "font-medium text-green-700"
                        }
                      >
                        {riskCategoryLabels[category]}
                      </span>
                    ) : (
                      <span className="text-gray-400">Belum final</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.status === "COMPLETE"
                          ? "font-medium text-green-700"
                          : "font-medium text-amber-700"
                      }
                    >
                      {customerStatusLabels[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/cdd/${c.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Tidak ada CDD yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
