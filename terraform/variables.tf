variable "project_id" {
  type        = string
  description = "GCP project ID tempat Service Account & API dibuat/diaktifkan."
  # PENTING (security hardening pass, cross-install isolation): default di
  # bawah ini BUKAN placeholder generik — ini project ID instalasi acuan
  # aplikasi ini yang SUDAH terprovisioning nyata. JANGAN andalkan default
  # ini untuk instalasi/klien baru (akan berbagi Service Account/project
  # yang sama dengan instalasi acuan, melanggar isolasi antar-klien) — buat
  # terraform.tfvars sendiri dari terraform.tfvars.example, JANGAN salin
  # nilai apa pun dari file ini apa adanya. Default ini sengaja TIDAK diubah
  # jadi placeholder karena terraform.tfstate lokal SUDAH melacak resource
  # nyata di project ini tanpa terraform.tfvars eksplisit — mengubah default
  # ini akan membuat `terraform plan` berikutnya (tanpa tfvars) mengira
  # project_id berubah dan mencoba me-replace resource yang sudah ada.
  default = "project-bead1995-1df2-4fdd-8ec"
}

variable "service_account_id" {
  type        = string
  description = "ID (bukan email) Service Account. 6-30 karakter: huruf kecil, angka, dash."
  # Default ini milik instalasi acuan yang sama seperti project_id di atas —
  # lihat catatan di sana. Instalasi/klien baru: override lewat terraform.tfvars.
  default = "notary-cdd-sync"

  validation {
    condition     = can(regex("^[a-z](?:[-a-z0-9]{4,28}[a-z0-9])$", var.service_account_id))
    error_message = "service_account_id harus 6-30 karakter, huruf kecil/angka/dash, diawali huruf."
  }
}

variable "spreadsheet_id" {
  type        = string
  description = "ID spreadsheet Google Sheets tujuan (segmen di URL setelah /d/). Hanya dipakai untuk menyusun link di output next_steps, tidak membuat/mengubah resource GCP apa pun."
  # Default ini milik instalasi acuan yang sama seperti project_id di atas —
  # lihat catatan di sana. Instalasi/klien baru: override lewat terraform.tfvars.
  default = "1WkQ_UhutY0cS4CTB7E_84bn9b7UxFg-uF3JhR_VQdTg"
}

# --- Persiapan Cloud Run (lihat cloud_run.tf untuk konteks lengkap) ---
# Semua variable di bawah ini HANYA dipakai kalau enable_cloud_run_prep=true.
# Default aman: mati total, tidak menambah resource apa pun ke
# `terraform apply` yang sudah ada untuk Service Account Sheets/Drive.

variable "enable_cloud_run_prep" {
  type        = bool
  description = "Gate utama: buat resource persiapan Cloud Run (Artifact Registry + service kosong)? Default false — tidak menyentuh apa pun sampai diaktifkan eksplisit."
  default     = false
}

variable "region" {
  type        = string
  description = "Region GCP untuk Artifact Registry & Cloud Run."
  default     = "asia-southeast2"
}

variable "artifact_repository_id" {
  type        = string
  description = "ID repository Artifact Registry (Docker) untuk image notary_aml."
  default     = "notary-aml-images"
}

variable "cloud_run_service_name" {
  type        = string
  description = "Nama service Cloud Run."
  default     = "notary-aml-web"
}

variable "container_image" {
  type        = string
  description = "Image container untuk service Cloud Run. Default placeholder publik Google — repo ini belum punya Dockerfile/build pipeline, jadi belum ada image nyata untuk di-deploy."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "cloud_run_allow_unauthenticated" {
  type        = bool
  description = "Izinkan invoke tanpa auth (allUsers)? Default false — model PIN-tunggal app ini tidak dirancang untuk endpoint publik tanpa lapisan auth tambahan."
  default     = false
}
