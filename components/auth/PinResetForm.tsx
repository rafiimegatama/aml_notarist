"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPinFormAction } from "@/lib/actions/pinRecovery";

export function PinResetForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(resetPinFormAction, undefined);

  useEffect(() => {
    if (state?.success) {
      router.push("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="pin" className="text-sm font-medium text-gray-700">
          PIN Baru
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          required
          minLength={4}
          maxLength={6}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
        />
      </div>
      <div>
        <label htmlFor="confirmPin" className="text-sm font-medium text-gray-700">
          Ulangi PIN Baru
        </label>
        <input
          id="confirmPin"
          name="confirmPin"
          type="password"
          inputMode="numeric"
          required
          minLength={4}
          maxLength={6}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
        />
      </div>
      {state && !state.success && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary px-4 py-2 text-sm"
      >
        {pending ? "Menyimpan..." : "Simpan PIN Baru"}
      </button>
    </form>
  );
}
