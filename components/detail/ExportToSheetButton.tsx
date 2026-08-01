"use client";

import { useState, useTransition } from "react";
import { exportCustomerToSheet } from "@/lib/actions/sheetsExport";

export function ExportToSheetButton({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await exportCustomerToSheet(customerId);
      setMessage(
        result.success
          ? { type: "success", text: "Berhasil disinkronkan ke Google Sheet." }
          : { type: "error", text: result.error }
      );
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {isPending ? "Menyinkronkan..." : "Export ke Google Sheet"}
      </button>
      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`max-w-xs text-right text-xs ${
            message.type === "error" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
