"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCustomerRecord } from "@/lib/actions/retention";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function RetentionDeleteButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteCustomerRecord(customerId);
    setPending(false);
    setOpen(false);
    if (result.success) {
      toast({ variant: "success", title: "Data berhasil dihapus", description: customerName });
    } else {
      toast({ variant: "error", title: "Gagal menghapus data", description: result.error });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-danger-subtle"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
        Hapus
      </button>
      <ConfirmDialog
        open={open}
        title={`Hapus data "${customerName}"?`}
        description="Tindakan ini TIDAK bisa dibatalkan. Seluruh data CDD, penilaian risiko, EDD, dan file scan akan dihapus permanen dari database dan disk. Pastikan Anda sudah memiliki backup sebelum melanjutkan."
        confirmLabel="Hapus Permanen"
        tone="danger"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
