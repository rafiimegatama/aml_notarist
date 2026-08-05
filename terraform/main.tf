# Terraform ini HANYA menyiapkan sisi GCP: aktifkan API + buat Service
# Account kosong (tanpa key/role). Ini selaras dengan lib/googleSheets/client.ts
# dan lib/googleDrive/client.ts di app: keduanya autentikasi lewat JWT Service
# Account (google-auth-library), bukan OAuth user flow.
#
# Sengaja TIDAK membuat google_service_account_key di sini — private key
# dibuat manual lewat `gcloud iam service-accounts keys create` (lihat
# output next_steps) supaya key tidak pernah tersimpan plaintext di
# terraform.tfstate.
#
# Sengaja TIDAK ada IAM role binding project-level untuk Sheets/Drive.
# Akses Service Account ke Spreadsheet & folder Drive tertentu diberikan
# lewat "Share" di Google Sheets/Drive UI (Workspace-level sharing), bukan
# lewat IAM GCP — Terraform google provider tidak, dan tidak perlu, mengelola
# permission per-file itu.

resource "google_project_service" "iam" {
  project            = var.project_id
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "orgpolicy" {
  project            = var.project_id
  service            = "orgpolicy.googleapis.com"
  disable_on_destroy = false
}

# Org 617058961201 menegakkan "Secure by Default" (iam.disableServiceAccountKeyCreation)
# di semua project turunannya. Override ini HANYA berlaku untuk project_id ini
# (parent = "projects/...", bukan "organizations/..."), jadi constraint org
# tetap aktif untuk project lain. Butuh roles/orgpolicy.policyAdmin di level
# organisasi untuk membuat resource ini (bukan cukup roles/owner project).
resource "google_org_policy_policy" "allow_sa_key_creation_this_project" {
  name   = "projects/${var.project_id}/policies/iam.disableServiceAccountKeyCreation"
  parent = "projects/${var.project_id}"

  spec {
    rules {
      enforce = "FALSE"
    }
  }

  depends_on = [google_project_service.orgpolicy]
}

resource "google_project_service" "sheets" {
  project            = var.project_id
  service            = "sheets.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "drive" {
  project            = var.project_id
  service            = "drive.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "notary_sync" {
  project      = var.project_id
  account_id   = var.service_account_id
  display_name = "Notary CDD - Sheets & Drive Sync"
  description  = "Backend lokal notary_aml (FR-1.3 export Google Sheets, FR-1.4 backup scan ke Google Drive). Key dibuat manual di luar Terraform."

  depends_on = [google_project_service.iam]
}
