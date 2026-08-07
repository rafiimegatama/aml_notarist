"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleAlert, Lock } from "lucide-react";
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
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="pin" className="text-sm font-medium text-slate-700">
          PIN Akses
        </label>
        <div className="relative mt-1.5">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
          />
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoFocus
            required
            minLength={4}
            maxLength={6}
            className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-center text-lg tracking-widest shadow-soft-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>
      {state && !state.success && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-danger-subtle px-3.5 py-2.5 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <p>{state.error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full px-4 py-2.5 text-sm"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
      <p className="text-center text-sm">
        <Link
          href="/lock/forgot"
          className="font-medium text-brand hover:underline"
        >
          Lupa PIN?
        </Link>
      </p>
    </form>
  );
}
