"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyPinFormAction } from "@/lib/actions/auth";

export function PinForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    verifyPinFormAction,
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      router.push(next);
      router.refresh();
    }
  }, [state, router, next]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="pin" className="text-sm font-medium text-gray-700">
        PIN Akses
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
        className="rounded border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
      />
      {state && !state.success && (
        <p role="alert" className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary px-4 py-2 text-sm"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
      <p className="text-center text-sm">
        <Link href="/lock/forgot" className="text-blue-600 hover:underline">
          Lupa PIN?
        </Link>
      </p>
    </form>
  );
}
