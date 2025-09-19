# Terraform configuration for CI/CD Dashboard on GCP
# Optimized for GCP Free Tier compliance

# -- Removed terraform block from here; put it in versions.tf --

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Enable required APIs
resource "google_project_service" "compute_api" {
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "container_api" {
  service            = "container.googleapis.com"
  disable_on_destroy = false
}

# Create VPC network
resource "google_compute_network" "cicd_vpc" {
  name                    = "cicd-dashboard-vpc"
  auto_create_subnetworks = false
  mtu                     = 1460
  depends_on              = [google_project_service.compute_api]
}

# Create subnet
resource "google_compute_subnetwork" "cicd_subnet" {
  name          = "cicd-dashboard-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.cicd_vpc.id
}

# Firewall rules
resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = google_compute_network.cicd_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "8080"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["cicd-dashboard"]
}

resource "google_compute_firewall" "allow_https" {
  name    = "allow-https"
  network = google_compute_network.cicd_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["cicd-dashboard"]
}

resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = google_compute_network.cicd_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["5000", "5432", "6379"]
  }

  source_ranges = ["10.0.1.0/24"]
  target_tags   = ["cicd-dashboard"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = google_compute_network.cicd_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["cicd-dashboard"]
}

# Static IP address
resource "google_compute_address" "cicd_static_ip" {
  name   = "cicd-dashboard-ip"
  region = var.region
}

# Startup script for Docker and app deployment
locals {
  startup_script = file("${path.module}/startup-script-complete.sh")
}

# VM instance
resource "google_compute_instance" "cicd_vm" {
  name         = "cicd-dashboard-vm"
  machine_type = "e2-micro"
  zone         = var.zone

  tags = ["cicd-dashboard"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    network    = google_compute_network.cicd_vpc.id
    subnetwork = google_compute_subnetwork.cicd_subnet.id
    access_config {
      nat_ip = google_compute_address.cicd_static_ip.address
    }
  }

  metadata = {
    startup-script    = local.startup_script
    slack_webhook_url = var.slack_webhook_url
  }

  service_account {
    email  = google_service_account.cicd_sa.email
    scopes = ["cloud-platform"]
  }

  depends_on = [
    google_project_service.compute_api,
    google_compute_firewall.allow_http,
    google_compute_firewall.allow_https,
    google_compute_firewall.allow_internal,
    google_compute_firewall.allow_ssh
  ]
}

# Service account
resource "google_service_account" "cicd_sa" {
  account_id   = "cicd-dashboard-sa"
  display_name = "CI/CD Dashboard Service Account"
}

# IAM bindings
resource "google_project_iam_member" "cicd_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cicd_sa.email}"
}

resource "google_project_iam_member" "cicd_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cicd_sa.email}"
}
