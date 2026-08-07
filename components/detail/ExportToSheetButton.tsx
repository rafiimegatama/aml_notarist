"use client";

import { useState, useTransition } from "react";
import { Sheet } from "lucide-react";
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
        className="btn btn-secondary px-4 py-2 text-sm"
      >
        <Sheet className="h-4 w-4" strokeWidth={2} />
        {isPending ? "Menyinkronkan..." : "Export ke Google Sheet"}
      </button>
      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`max-w-xs text-right text-xs font-medium ${
            message.type === "error" ? "text-[#b91c1c]" : "text-[#15803d]"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
