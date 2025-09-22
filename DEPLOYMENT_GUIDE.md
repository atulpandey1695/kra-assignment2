# CI/CD Dashboard - GCP Deployment Guide

This guide provides step-by-step instructions for deploying the CI/CD Dashboard on Google Cloud Platform using Terraform Infrastructure-as-Code.

## 🎯 Overview

The deployment creates a complete CI/CD monitoring solution with:
- **Real-time Metrics**: Live system and application monitoring
- **Interactive Dashboard**: Modern React-based UI
- **Database Integration**: PostgreSQL with comprehensive schema
- **Alert System**: Slack and email notifications
- **Cost Optimization**: GCP Free Tier compliant

## 📋 Prerequisites

### Required Tools
- [Terraform](https://www.terraform.io/downloads.html) (>= 1.0)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/) (for local testing)
- [Git](https://git-scm.com/downloads)

### GCP Setup
1. **Create GCP Project**
   ```bash
   # Create new project
   gcloud projects create your-cicd-project-id
   
   # Set project
   gcloud config set project your-cicd-project-id
   ```

2. **Enable Billing**
   - Go to [GCP Console](https://console.cloud.google.com)
   - Navigate to Billing
   - Link a billing account to your project

3. **Enable Required APIs**
   ```bash
   gcloud services enable compute.googleapis.com
   gcloud services enable container.googleapis.com
   ```

4. **Authenticate**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

## 🚀 Deployment Steps

### Step 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/atulpandey1695/kra-assignment2.git
cd kra-assignment2/cicd-dashboard

# Navigate to terraform directory
cd terraform
```

### Step 2: Configure Terraform Variables

```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your project details
nano terraform.tfvars
```

Update `terraform.tfvars`:
```hcl
project_id = "your-cicd-project-id"
region     = "us-central1"
zone       = "us-central1-a"
```

### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Apply the configuration
terraform apply
```

**Expected Output:**
```
Apply complete! Resources: 8 added.

Outputs:

public_ip = "34.123.45.67"
public_url = "http://34.123.45.67"
ssh_command = "gcloud compute ssh --zone us-central1-a cicd-dashboard-vm --project your-cicd-project-id"
```

### Step 4: Wait for Application Startup

The application takes 5-10 minutes to fully start. Monitor progress:

```bash
# Check VM status
gcloud compute instances list

# View startup logs
gcloud compute instances get-serial-port-output cicd-dashboard-vm --zone us-central1-a
```

### Step 5: Access the Application

Once deployment is complete:

1. **Main Dashboard**: `http://YOUR_VM_IP`
2. **Live Metrics**: `http://YOUR_VM_IP/metrics`
3. **API Health**: `http://YOUR_VM_IP/api/health`
4. **Status Page**: `http://YOUR_VM_IP/status`

## 🔧 Post-Deployment Configuration

### Enable Live Metrics

```bash
# SSH into the VM
gcloud compute ssh --zone us-central1-a cicd-dashboard-vm

# Run metrics setup
cd /opt/cicd-dashboard
sudo bash terraform/live-metrics-setup.sh

# Restart application
docker-compose restart
```

### Configure Alerts

1. **Slack Integration**
   ```bash
   # Set Slack webhook URL
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
   ```

2. **Email Alerts**
   ```bash
   # Configure SMTP settings
   export SMTP_HOST="smtp.gmail.com"
   export SMTP_PORT="587"
   export SMTP_USER="your-email@gmail.com"
   export SMTP_PASS="your-app-password"
   ```

### Customize Dashboard

Edit configuration files:
- **Database**: `/opt/cicd-dashboard/init-db.sql`
- **Nginx**: `/opt/cicd-dashboard/nginx/default.conf`
- **Environment**: `/opt/cicd-dashboard/.env`

## 📊 Live Metrics Features

### Real-time Monitoring
- **System Resources**: CPU, Memory, Disk usage
- **Container Health**: Docker container status
- **Database Metrics**: Connection counts, query performance
- **Network Status**: Port monitoring, connectivity

### Interactive Dashboard
- **Live Charts**: Real-time data visualization
- **Auto-refresh**: 30-second update intervals
- **Historical Data**: Trend analysis
- **Export Capabilities**: Data export in multiple formats

### API Endpoints
```bash
# Real-time metrics
curl http://YOUR_VM_IP/api/metrics/realtime

# System health
curl http://YOUR_VM_IP/api/metrics/health

# Historical data
curl http://YOUR_VM_IP/api/metrics/historical/24
```

## 🔍 Monitoring and Maintenance

### Health Checks

```bash
# Check application status
curl http://YOUR_VM_IP/api/health

# View container logs
docker-compose logs -f

# Monitor resource usage
docker stats
```

### Log Management

```bash
# View application logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Check system logs
journalctl -u cicd-dashboard.service
```

### Backup and Recovery

```bash
# Backup database
docker-compose exec postgres pg_dump -U atulp testdb > backup.sql

# Restore database
docker-compose exec -T postgres psql -U atulp testdb < backup.sql
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Application Not Accessible
```bash
# Check VM status
gcloud compute instances describe cicd-dashboard-vm --zone us-central1-a

# Verify firewall rules
gcloud compute firewall-rules list --filter="name~cicd"

# Check application logs
gcloud compute ssh --zone us-central1-a cicd-dashboard-vm --command="docker-compose logs"
```

#### 2. Services Not Starting
```bash
# Check Docker status
systemctl status docker

# Verify disk space
df -h

# Check container health
docker-compose ps
```

#### 3. Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U atulp -d testdb

# Verify environment variables
docker-compose exec backend env | grep DB_
```

### Performance Optimization

#### Database Tuning
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Application Optimization
```bash
# Monitor resource usage
htop
iostat -x 1
docker stats --no-stream

# Check memory usage
free -h
cat /proc/meminfo
```

## 💰 Cost Management

### Free Tier Compliance
- **VM**: e2-micro (1 vCPU, 1GB RAM)
- **Storage**: 20GB standard persistent disk
- **Network**: Standard tier (1GB egress free/month)
- **Static IP**: Free when VM is running

### Cost Monitoring
```bash
# Check current usage
gcloud billing accounts list
gcloud billing budgets list

# Monitor costs
gcloud logging read "resource.type=gce_instance"
```

### Optimization Tips
1. **Use Preemptible Instances**: For non-critical workloads
2. **Implement Auto-shutdown**: During non-business hours
3. **Monitor Resource Usage**: Regular performance reviews
4. **Clean Up Resources**: Remove unused snapshots and images

## 🔐 Security Considerations

### Network Security
- **VPC Isolation**: Private network configuration
- **Firewall Rules**: Restricted port access
- **SSL/TLS**: HTTPS encryption (optional)

### Application Security
- **Environment Variables**: Sensitive data protection
- **Database Security**: Connection encryption
- **Access Control**: Service account permissions

### Best Practices
1. **Regular Updates**: Keep system and dependencies updated
2. **Backup Strategy**: Automated database backups
3. **Monitoring**: Continuous security monitoring
4. **Access Management**: Principle of least privilege

## 🧹 Cleanup

To destroy the infrastructure:

```bash
# Navigate to terraform directory
cd terraform

# Destroy all resources
terraform destroy

# Confirm destruction
# Type 'yes' when prompted
```

**Warning**: This will permanently delete all resources and data.

## 📚 Additional Resources

### Documentation
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest)
- [GCP Free Tier](https://cloud.google.com/free)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Support
- **GitHub Issues**: [Repository Issues](https://github.com/atulpandey1695/kra-assignment2/issues)
- **Documentation**: Check the README.md files
- **Community**: GCP and Terraform communities

---

**Deployed with ❤️ using Terraform and GCP**

