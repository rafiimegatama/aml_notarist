output "service_account_email" {
  value       = google_service_account.notary_sync.email
  description = "Salin ke .env sebagai GOOGLE_SERVICE_ACCOUNT_EMAIL. Juga email yang harus di-share Editor ke Spreadsheet & folder Drive."
}

output "next_steps" {
  description = "Langkah manual setelah `terraform apply` (tidak bisa/tidak sebaiknya diotomasi via Terraform)."
  value       = <<-EOT
    1. Share Spreadsheet ke ${google_service_account.notary_sync.email} sebagai Editor:
       https://docs.google.com/spreadsheets/d/${var.spreadsheet_id}/edit -> tombol Share

    2. Buat folder khusus (bukan folder pribadi) di Google Drive untuk backup scan,
       share folder itu ke email yang sama sebagai Editor, salin folder ID dari URL-nya
       ke GOOGLE_DRIVE_FOLDER_ID di .env.

    3. Generate private key Service Account (di luar Terraform, tidak masuk state):
       gcloud iam service-accounts keys create ./sa-key.json \
         --iam-account=${google_service_account.notary_sync.email} \
         --project=${var.project_id}

    4. Isi terraform_aml/.env dari isi sa-key.json:
       - field "client_email"  -> GOOGLE_SERVICE_ACCOUNT_EMAIL
       - field "private_key"   -> GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (biarkan "\n" literal apa adanya)
       - GOOGLE_SHEETS_SPREADSHEET_ID=${var.spreadsheet_id}
       - GOOGLE_SHEETS_SHEET_NAME=Sheet1 (atau nama tab lain)
       - GOOGLE_DRIVE_FOLDER_ID=<folder ID dari langkah 2>

    5. Hapus sa-key.json setelah disalin ke .env:
       rm ./sa-key.json
  EOT
}

output "cloud_run_prep_status" {
  description = "Status persiapan Cloud Run — lihat cloud_run.tf untuk syarat sebelum diaktifkan."
  value = var.enable_cloud_run_prep ? (
    "AKTIF (prep only): service '${var.cloud_run_service_name}' di region ${var.region} pakai image placeholder '${var.container_image}'. Ini BUKAN deployment app notary yang siap dipakai notaris sungguhan — lihat komentar di cloud_run.tf (SQLite/local-storage/auth belum di-rework untuk lingkungan stateless)."
    ) : (
    "NONAKTIF (default). Set enable_cloud_run_prep=true di terraform.tfvars untuk membuat Artifact Registry + service Cloud Run kosong (placeholder image, bukan app ini)."
  )
}
