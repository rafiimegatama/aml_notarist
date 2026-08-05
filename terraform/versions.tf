terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id

  # ADC (gcloud auth application-default login) tidak punya billing project
  # bawaan untuk beberapa API (orgpolicy.googleapis.com salah satunya) —
  # tanpa ini provider jatuh ke quota project internal gcloud SDK sendiri
  # (764086051850) yang tidak enabled untuk API tsb.
  user_project_override = true
  billing_project       = var.project_id
}
