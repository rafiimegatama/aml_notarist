variable "project_id" {
  type        = string
  description = "GCP project ID tempat Service Account & API dibuat/diaktifkan."
  default     = "project-bead1995-1df2-4fdd-8ec"
}

variable "service_account_id" {
  type        = string
  description = "ID (bukan email) Service Account. 6-30 karakter: huruf kecil, angka, dash."
  default     = "notary-cdd-sync"

  validation {
    condition     = can(regex("^[a-z](?:[-a-z0-9]{4,28}[a-z0-9])$", var.service_account_id))
    error_message = "service_account_id harus 6-30 karakter, huruf kecil/angka/dash, diawali huruf."
  }
}

variable "spreadsheet_id" {
  type        = string
  description = "ID spreadsheet Google Sheets tujuan (segmen di URL setelah /d/). Hanya dipakai untuk menyusun link di output next_steps, tidak membuat/mengubah resource GCP apa pun."
  default     = "1WkQ_UhutY0cS4CTB7E_84bn9b7UxFg-uF3JhR_VQdTg"
}
