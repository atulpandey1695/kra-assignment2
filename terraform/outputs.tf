# Outputs for CI/CD Dashboard Terraform configuration

output "public_ip" {
  description = "The public IP address of the CI/CD Dashboard VM"
  value       = google_compute_address.cicd_static_ip.address
}

output "public_url" {
  description = "The public URL to access the CI/CD Dashboard"
  value       = "http://${google_compute_address.cicd_static_ip.address}"
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "gcloud compute ssh --zone ${var.zone} cicd-dashboard-vm --project ${var.project_id}"
}

output "vm_name" {
  description = "The name of the created VM"
  value       = google_compute_instance.cicd_vm.name
}

output "vm_zone" {
  description = "The zone where the VM is located"
  value       = google_compute_instance.cicd_vm.zone
}

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "deployment_instructions" {
  description = "Instructions for accessing the deployed application"
  value       = <<-EOT
    CI/CD Dashboard has been deployed successfully!
    
    🌐 Application URL: http://${google_compute_address.cicd_static_ip.address}
    📊 Status Page: http://${google_compute_address.cicd_static_ip.address}/status
    🔧 SSH Access: gcloud compute ssh --zone ${var.zone} cicd-dashboard-vm --project ${var.project_id}
    
    📋 Next Steps:
    1. Wait 5-10 minutes for the application to fully start
    2. Visit the application URL to access the dashboard
    3. Check the status page for service health
    4. Use SSH to access logs: docker-compose logs -f
    
    🔍 Monitoring:
    - Run './monitor.sh' on the VM to check service health
    - Check logs with: docker-compose logs -f
    - Restart services with: docker-compose restart
    
    💰 Cost Optimization:
    - This deployment uses GCP Free Tier eligible resources
    - VM: e2-micro (1 vCPU, 1GB RAM)
    - Disk: 20GB standard persistent disk
    - Network: Standard tier (no egress charges for first 1GB/month)
  EOT
}

