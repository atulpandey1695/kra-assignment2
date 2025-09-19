# Startup Script Fix - CI/CD Dashboard

## 🔧 **Problem Identified**

The original startup script had several issues:
1. **Complex template file approach** - Using `templatefile()` with multiple file injections
2. **Docker installation method** - Using apt repository instead of official Docker script
3. **Missing error handling** - Script would fail silently on errors
4. **Too many dependencies** - Complex nginx setup and live metrics integration
5. **No logging** - Difficult to debug when things went wrong

## ✅ **Solution Implemented**

### **1. Simplified Startup Script**
- **File**: `startup-script-fixed.sh`
- **Approach**: Direct file content instead of template injection
- **Docker Installation**: Using official Docker installation script
- **Error Handling**: `set -e` with comprehensive logging
- **Logging**: All output redirected to `/var/log/startup-script.log`

### **2. Key Improvements**
- ✅ **Reliable Docker Installation**: Uses `curl -fsSL https://get.docker.com`
- ✅ **Simplified Docker Compose**: Direct binary installation
- ✅ **Comprehensive Logging**: All output logged for debugging
- ✅ **Error Handling**: Script stops on any error
- ✅ **Self-contained**: No external file dependencies
- ✅ **Health Checks**: Built-in service monitoring
- ✅ **Auto-restart**: Systemd service for automatic startup

### **3. Script Features**
- **System Updates**: Updates all packages
- **Docker Installation**: Official Docker CE installation
- **Docker Compose**: Standalone binary installation
- **Application Setup**: Creates all necessary files
- **Service Deployment**: Starts all containers
- **Health Monitoring**: Built-in health checks
- **Auto-start**: Systemd service for VM restart

## 🚀 **Deployment Instructions**

### **Step 1: Destroy Existing Infrastructure**
```bash
cd terraform
terraform destroy
# Type 'yes' when prompted
```

### **Step 2: Deploy with Fixed Script**
```bash
# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### **Step 3: Monitor Deployment**
```bash
# Check VM status
gcloud compute instances list

# View startup script logs
gcloud compute instances get-serial-port-output cicd-dashboard-vm --zone us-central1-a

# SSH into VM to check status
gcloud compute ssh --zone us-central1-a cicd-dashboard-vm
```

### **Step 4: Verify Application**
```bash
# On the VM, check services
cd /opt/cicd-dashboard
docker-compose ps

# Check logs
docker-compose logs -f

# Run health check
./monitor.sh
```

## 📊 **Expected Results**

### **After Successful Deployment:**
- **Frontend**: `http://YOUR_VM_IP:8080`
- **Backend API**: `http://YOUR_VM_IP:5000`
- **Health Check**: `http://YOUR_VM_IP:5000/health`

### **Running Containers:**
- `cicd-postgres` - PostgreSQL database
- `cicd-redis` - Redis cache
- `cicd-backend` - Node.js API server
- `cicd-frontend` - React frontend

### **Log Files:**
- **Startup Logs**: `/var/log/startup-script.log`
- **Application Logs**: `docker-compose logs -f`

## 🔍 **Troubleshooting**

### **If Deployment Fails:**
1. **Check startup logs**:
   ```bash
   gcloud compute instances get-serial-port-output cicd-dashboard-vm --zone us-central1-a
   ```

2. **SSH into VM and check**:
   ```bash
   gcloud compute ssh --zone us-central1-a cicd-dashboard-vm
   sudo tail -f /var/log/startup-script.log
   ```

3. **Check Docker status**:
   ```bash
   sudo systemctl status docker
   sudo docker --version
   sudo docker-compose --version
   ```

4. **Check application directory**:
   ```bash
   ls -la /opt/cicd-dashboard/
   cat /opt/cicd-dashboard/docker-compose.yml
   ```

### **If Services Don't Start:**
1. **Check container status**:
   ```bash
   cd /opt/cicd-dashboard
   docker-compose ps
   ```

2. **Check container logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs postgres
   ```

3. **Restart services**:
   ```bash
   docker-compose restart
   ```

## 📋 **Script Validation**

### **Test the Script Locally:**
```bash
cd terraform
./test-startup.sh
```

### **Manual Script Test:**
```bash
# Test syntax
bash -n startup-script-fixed.sh

# Test on a local VM (optional)
sudo ./startup-script-fixed.sh
```

## 🎯 **Key Differences from Original**

| Aspect | Original Script | Fixed Script |
|--------|----------------|--------------|
| **File Injection** | `templatefile()` with multiple files | Direct file content |
| **Docker Install** | APT repository method | Official Docker script |
| **Error Handling** | Basic | Comprehensive with logging |
| **Dependencies** | Complex (nginx, metrics) | Minimal (Docker only) |
| **Logging** | Limited | Full logging to file |
| **Debugging** | Difficult | Easy with log files |
| **Reliability** | Medium | High |

## ✅ **Success Criteria**

The deployment is successful when:
- [ ] VM starts and runs startup script
- [ ] Docker and Docker Compose are installed
- [ ] All 4 containers are running
- [ ] Frontend is accessible on port 8080
- [ ] Backend API is accessible on port 5000
- [ ] Health check returns 200 OK
- [ ] Database is initialized with tables
- [ ] No errors in startup logs

## 🚀 **Next Steps After Deployment**

1. **Access the application** at the provided URL
2. **Test all functionality** (pipelines, metrics, alerts)
3. **Configure monitoring** and alerting
4. **Set up backups** for the database
5. **Monitor resource usage** and performance

---

**The fixed startup script should now work reliably during VM boot without manual intervention!** 🎉
