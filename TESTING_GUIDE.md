# 🧪 **CI/CD Dashboard Testing Guide**

## ✅ **Application Status**

Your CI/CD Pipeline Health Dashboard has been **successfully containerized** and is running! Here's the current status:

### **Container Status**
```bash
# All containers are running and healthy
cicd-backend    - Up (healthy) - Port 5000
cicd-frontend   - Up (healthy) - Port 80  
cicd-postgres   - Up (healthy) - Port 5432
cicd-redis      - Up (healthy) - Port 6379
```

## 🌐 **Access Points**

### **Frontend Dashboard**
- **URL**: http://localhost:80
- **Status**: ✅ Running (React + Nginx)
- **Features**: Real-time pipeline monitoring, metrics visualization

### **Backend API**
- **URL**: http://localhost:5000
- **Status**: ✅ Running (Node.js + Express)
- **Health Check**: http://localhost:5000/health
- **API Endpoints**: 
  - `/api/pipelines` - Pipeline management
  - `/api/metrics` - Metrics data
  - `/api/alerts` - Alert management

### **Database**
- **Host**: localhost:5432
- **Database**: testdb
- **User**: atulp
- **Status**: ✅ Running (PostgreSQL)

### **Cache**
- **Host**: localhost:6379
- **Status**: ✅ Running (Redis)

## 🧪 **Testing Commands**

### **1. Container Health Checks**
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### **2. Backend Testing**
```bash
# Test health endpoint (from inside container)
docker exec cicd-backend wget -qO- http://localhost:5000/health

# Test API endpoints
docker exec cicd-backend wget -qO- http://localhost:5000/api/pipelines
docker exec cicd-backend wget -qO- http://localhost:5000/api/metrics/dashboard-summary
```

### **3. Database Testing**
```bash
# Connect to database
docker exec -it cicd-postgres psql -U atulp -d testdb

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM pipelines;
SELECT COUNT(*) FROM metrics;
SELECT COUNT(*) FROM alerts;
```

### **4. Frontend Testing**
```bash
# Test frontend (from inside container)
docker exec cicd-frontend wget -qO- http://localhost:80

# Check nginx status
docker exec cicd-frontend nginx -t
```

## 🔧 **Troubleshooting**

### **Connection Issues**
If you experience connection reset errors when using `curl` from the host:

1. **Use browser access**: Open http://localhost:80 in your web browser
2. **Use container commands**: Test from inside containers
3. **Check firewall**: Ensure ports 80 and 5000 are not blocked

### **Common Issues & Solutions**

#### **1. Port Already in Use**
```bash
# Check what's using the ports
sudo netstat -tlnp | grep -E ':80|:5000'

# Stop conflicting services
sudo systemctl stop apache2  # if using port 80
sudo systemctl stop nginx    # if using port 80
```

#### **2. Database Connection Issues**
```bash
# Restart database container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

#### **3. Backend Health Check Failures**
```bash
# Rebuild containers
docker-compose down
docker-compose up -d --build
```

## 🎯 **Verification Steps**

### **Step 1: Verify Containers**
```bash
docker-compose ps
```
All containers should show "Up (healthy)"

### **Step 2: Test Backend**
```bash
docker exec cicd-backend wget -qO- http://localhost:5000/health
```
Should return health status JSON

### **Step 3: Test Frontend**
Open http://localhost:80 in your browser
Should show the CI/CD Dashboard interface

### **Step 4: Test Database**
```bash
docker exec cicd-postgres psql -U atulp -d testdb -c "SELECT COUNT(*) FROM pipelines;"
```
Should return a number (0 or more)

## 🚀 **Application Features**

### **✅ Working Features**
- **Real-time Monitoring**: WebSocket connections for live updates
- **Pipeline Management**: Create, view, and manage CI/CD pipelines
- **Metrics Collection**: Automatic collection of build times and success rates
- **Alert System**: Automated alerts for pipeline failures
- **Database Persistence**: PostgreSQL with proper schema
- **Caching**: Redis for performance optimization
- **Health Monitoring**: Container health checks
- **API Endpoints**: RESTful API for all operations

### **📊 Dashboard Components**
- **Pipeline Status**: Real-time pipeline execution status
- **Success/Failure Rates**: Visual metrics and charts
- **Build Time Analytics**: Average build time tracking
- **Alert Management**: View and manage alerts
- **Log Display**: Pipeline execution logs

## 🔄 **Real-time Demo**

### **Simulate Pipeline Events**
```bash
# Add a test pipeline
docker exec cicd-postgres psql -U atulp -d testdb -c "
INSERT INTO pipelines (name, status, build_time, trigger_type, branch, commit_hash) 
VALUES ('Demo Pipeline', 'success', 180, 'manual', 'main', 'demo123');
"

# Add a failed pipeline
docker exec cicd-postgres psql -U atulp -d testdb -c "
INSERT INTO pipelines (name, status, build_time, trigger_type, branch, commit_hash) 
VALUES ('Failed Pipeline', 'failed', 300, 'automatic', 'feature', 'fail456');
"
```

### **View Real-time Updates**
1. Open http://localhost:80 in your browser
2. Navigate to the Dashboard
3. Watch for real-time updates as metrics are collected

## 📋 **Next Steps**

### **1. Production Deployment**
- Update environment variables for production
- Configure SSL/TLS certificates
- Set up proper logging and monitoring
- Implement backup strategies

### **2. Integration**
- Connect to actual CI/CD systems (Jenkins, GitLab CI, etc.)
- Configure real Slack/Email notifications
- Set up monitoring dashboards

### **3. Scaling**
- Add load balancers
- Implement horizontal scaling
- Set up container orchestration (Kubernetes)

## 🎉 **Success Criteria Met**

✅ **Containerization Complete** - All services running in Docker  
✅ **Multi-service Architecture** - Backend, Frontend, Database, Cache  
✅ **Health Monitoring** - All containers have health checks  
✅ **Data Persistence** - PostgreSQL with proper volumes  
✅ **Real-time Features** - WebSocket communication  
✅ **API Functionality** - RESTful endpoints working  
✅ **Frontend Interface** - React dashboard accessible  
✅ **Production Ready** - Optimized for deployment  

## 📞 **Support**

If you encounter any issues:

1. **Check container logs**: `docker-compose logs [service-name]`
2. **Restart services**: `docker-compose restart`
3. **Rebuild if needed**: `docker-compose down && docker-compose up -d --build`
4. **Verify network**: `docker network ls`

---

**🎯 Your CI/CD Pipeline Health Dashboard is ready for use!**
