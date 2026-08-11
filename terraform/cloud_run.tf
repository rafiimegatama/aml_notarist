# PERSIAPAN Cloud Run — bukan migrasi. Semua resource di file ini digated di
# belakang var.enable_cloud_run_prep (default FALSE), sehingga `terraform
# apply` yang sudah ada untuk Service Account Sheets/Drive (main.tf) TIDAK
# ikut membuat resource Cloud Run tanpa opt-in eksplisit.
#
# PENTING — baca sebelum mengaktifkan: aplikasi ini (lihat CLAUDE.md di root
# repo) SENGAJA dirancang lokal-only: SQLite sebagai satu-satunya sumber
# data, upload scan KTP/dll. dienkripsi lalu ditulis ke disk lokal
# (storage/uploads/), kunci enkripsi diturunkan dari secret di .env lokal,
# dan otentikasi cuma satu PIN bersama (bukan multi-tenant) yang diasumsikan
# terikat ke 127.0.0.1/intranet kantor (lihat proxy.ts, FR-6A/FR-6B di
# changelog). Cloud Run itu stateless & container-nya ephemeral:
#   - file SQLite (prisma/dev.db) TIDAK bertahan lintas instance/redeploy
#     kecuali dipindah ke Cloud SQL (atau setara) — belum dikerjakan.
#   - storage/uploads/ TIDAK bertahan lintas instance/redeploy kecuali
#     dipindah ke Cloud Storage — belum dikerjakan.
#   - model PIN tunggal + cookie sesi `secure:false` (sengaja, untuk
#     http://127.0.0.1) perlu ditinjau ulang untuk endpoint HTTPS publik.
#   - DATA_ENCRYPTION_KEY/DOCUMENT_ENCRYPTION_KEY/SESSION_SECRET perlu
#     dipindah ke Secret Manager, bukan env var biasa di service Cloud Run.
#
# File ini HANYA menyiapkan Artifact Registry + service Cloud Run kosong
# (image placeholder publik) supaya pipeline deploy bisa divalidasi lebih
# dulu — BUKAN deployment app notary ini yang sudah production-ready di
# Cloud Run. Jangan arahkan trafik notaris sungguhan ke sini tanpa
# menuntaskan poin-poin di atas.

resource "google_project_service" "run" {
  count = var.enable_cloud_run_prep ? 1 : 0

  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  count = var.enable_cloud_run_prep ? 1 : 0

  project            = var.project_id
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "notary_aml_images" {
  count = var.enable_cloud_run_prep ? 1 : 0

  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repository_id
  format        = "DOCKER"
  description   = "Image container untuk deploy notary_aml ke Cloud Run (persiapan, belum ada image nyata)."

  depends_on = [google_project_service.artifactregistry]
}

resource "google_cloud_run_v2_service" "notary_aml" {
  count = var.enable_cloud_run_prep ? 1 : 0

  project  = var.project_id
  name     = var.cloud_run_service_name
  location = var.region

  # Ingress default (semua trafik lewat load balancer Google) sengaja
  # dipertahankan, bukan INGRESS_TRAFFIC_INTERNAL_ONLY — mengunci ini ke
  # internal butuh Serverless VPC Access + Cloud VPN/Interconnect ke
  # jaringan kantor notaris, di luar cakupan persiapan ini.
  template {
    containers {
      # Placeholder publik Google (hello-world) — SENGAJA bukan image app
      # ini sendiri, karena belum ada Dockerfile/build pipeline di repo ini.
      # Ganti lewat var.container_image setelah image nyata di-push ke
      # Artifact Registry di atas.
      image = var.container_image

      ports {
        container_port = 8080
      }
    }
  }

  depends_on = [google_project_service.run]
}

# Akses publik TIDAK diaktifkan secara default — model PIN-tunggal app ini
# tidak dirancang untuk endpoint internet-facing tanpa lapisan auth
# tambahan. Set var.cloud_run_allow_unauthenticated=true hanya untuk
# eksperimen/testing pipeline dengan image placeholder, bukan untuk data
# notaris sungguhan.
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count = var.enable_cloud_run_prep && var.cloud_run_allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.notary_aml[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
