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
      className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs"
    >
      {pending ? "Menyimpan..." : done ? "Tersimpan" : "Tandai Sudah Ditinjau"}
    </button>
  );
}
