"use client";

import { useState } from "react";
import { markCustomerReviewed } from "@/lib/actions/review";

export function MarkReviewedButton({ customerId }: { customerId: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setPending(true);
    await markCustomerReviewed(customerId);
    setPending(false);
    setDone(true);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {pending ? "Menyimpan..." : done ? "Tersimpan" : "Tandai Sudah Ditinjau"}
    </button>
  );
}
