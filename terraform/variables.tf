# Variables for CI/CD Dashboard Terraform configuration

variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "crested-archive-469119-u6" # Replace with your actual project ID
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1" # Free Tier eligible region
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a" # Free Tier eligible zone
}

variable "machine_type" {
  description = "The machine type for the VM"
  type        = string
  default     = "e2-micro" # Free Tier eligible
}

variable "disk_size" {
  description = "The size of the boot disk in GB"
  type        = number
  default     = 20 # Free Tier allows up to 30GB
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "cicd-dashboard"
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}
