# CI/CD Dashboard - GCP Terraform Deployment

This directory contains Terraform configuration files to deploy the CI/CD Dashboard application on Google Cloud Platform (GCP) using Infrastructure-as-Code (IaC).

## 🏗️ Architecture

The deployment creates:
- **Compute Engine VM** (e2-micro - Free Tier eligible)
- **VPC Network** with custom subnet
- **Firewall Rules** for HTTP/HTTPS access
- **Static IP Address** for consistent access
- **Service Account** with minimal required permissions

## 📋 Prerequisites

1. **GCP Account** with billing enabled
2. **Terraform** installed (>= 1.0)
3. **Google Cloud SDK** installed and authenticated
4. **Docker** installed locally (for building images)

## 🚀 Quick Start

### 1. Configure GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com

# Set default project
gcloud config set project $PROJECT_ID
```

### 2. Configure Terraform

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

Update `terraform.tfvars`:
```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"
zone       = "us-central1-a"
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 4. Access the Application

After deployment completes, you'll see output like:
```
public_url = "http://34.123.45.67"
```

Wait 5-10 minutes for the application to fully start, then visit the URL.

## 🔧 Configuration Files

| File | Description |
|------|-------------|
| `main.tf` | Main Terraform configuration |
| `variables.tf` | Input variables |
| `outputs.tf` | Output values |
| `versions.tf` | Provider version constraints |
| `startup-script.sh` | VM initialization script |
| `terraform.tfvars.example` | Example variables file |

## 💰 Cost Optimization

This deployment is optimized for GCP Free Tier:

- **VM**: e2-micro (1 vCPU, 1GB RAM) - Free Tier eligible
- **Disk**: 20GB standard persistent disk - Free Tier eligible
- **Network**: Standard tier (first 1GB egress free per month)
- **Static IP**: Free when VM is running

**Estimated Monthly Cost**: $0 (within Free Tier limits)

## 🔍 Monitoring & Management

### Check Application Status
```bash
# SSH into the VM
gcloud compute ssh --zone us-central1-a cicd-dashboard-vm

# Check service health
./monitor.sh

# View logs
docker-compose logs -f
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application
```bash
# Pull latest changes
git pull

# Redeploy
./deploy.sh
```

## 🛠️ Troubleshooting

### Common Issues

1. **Application not accessible**
   - Wait 5-10 minutes for full startup
   - Check firewall rules: `gcloud compute firewall-rules list`
   - Verify VM is running: `gcloud compute instances list`

2. **Services not starting**
   - Check logs: `docker-compose logs`
   - Verify Docker is running: `systemctl status docker`
   - Check disk space: `df -h`

3. **Database connection issues**
   - Wait for PostgreSQL to initialize
   - Check database logs: `docker-compose logs postgres`
   - Verify environment variables

### Useful Commands

```bash
# Check VM status
gcloud compute instances describe cicd-dashboard-vm --zone us-central1-a

# View startup script logs
gcloud compute instances get-serial-port-output cicd-dashboard-vm --zone us-central1-a

# Check firewall rules
gcloud compute firewall-rules list --filter="name~cicd"

# View application logs
gcloud compute ssh --zone us-central1-a cicd-dashboard-vm --command="docker-compose logs -f"
```

## 🧹 Cleanup

To destroy the infrastructure:

```bash
# Destroy all resources
terraform destroy

# Confirm destruction
# Type 'yes' when prompted
```

## 📊 Live Metrics Integration

The application includes real-time metrics collection:

- **WebSocket Support**: Live updates via Socket.IO
- **Database Metrics**: Pipeline performance tracking
- **Health Checks**: Automated service monitoring
- **Alert System**: Slack/Email notifications

### Metrics Endpoints

- `GET /api/metrics` - Pipeline metrics
- `GET /api/pipelines` - Pipeline status
- `GET /api/alerts` - Alert management
- `GET /health` - Service health check

## 🔐 Security Considerations

- Firewall rules restrict access to necessary ports only
- Service account has minimal required permissions
- Application runs in isolated VPC
- HTTPS can be enabled with SSL certificates

## 📚 Additional Resources

- [GCP Free Tier Documentation](https://cloud.google.com/free)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [CI/CD Dashboard Application Docs](../README.md)
