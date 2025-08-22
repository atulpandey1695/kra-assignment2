# 🐳 Docker Run Instructions for CI/CD Pipeline Health Dashboard

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- Ports 80, 5000, 5432, 6379 available

## 🚀 Quick Start

### 1. Clone and Navigate to Project
```bash
cd cicd-dashboard
```

### 2. Build and Start All Services
```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 3. Access the Application
- **Frontend Dashboard**: http://localhost:80
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Detailed Instructions

### Option 1: Full Stack with Docker Compose (Recommended)

```bash
# 1. Build and start all services
docker-compose up -d --build

# 2. Check service status
docker-compose ps

# 3. View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 4. Access the application
open http://localhost:80
```

### Option 2: Individual Container Deployment

#### Backend Only
```bash
# Build backend image
docker build -f Dockerfile.backend -t cicd-backend .

# Run backend container
docker run -d \
  --name cicd-backend \
  -p 5000:5000 \
  -e DB_HOST=your-postgres-host \
  -e DB_PORT=5432 \
  -e DB_NAME=testdb \
  -e DB_USER=atulp \
  -e DB_PASSWORD=atulp123 \
  cicd-backend
```

#### Frontend Only
```bash
# Build frontend image
docker build -f Dockerfile.frontend -t cicd-frontend .

# Run frontend container
docker run -d \
  --name cicd-frontend \
  -p 80:80 \
  cicd-frontend
```

### Option 3: Development Mode

```bash
# Start only database for development
docker-compose up -d postgres redis

# Run backend in development mode
npm install
npm run dev

# Run frontend in development mode
cd client
npm install
npm start
```

## 🧪 Testing the Deployment

### 1. Health Checks
```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend health
curl http://localhost:80

# Check database connection
docker exec cicd-postgres pg_isready -U atulp -d testdb
```

### 2. API Testing
```bash
# Test pipelines API
curl http://localhost:5000/api/pipelines

# Test metrics API
curl http://localhost:5000/api/metrics/dashboard-summary

# Test alerts API
curl http://localhost:5000/api/alerts
```

### 3. Database Testing
```bash
# Connect to database
docker exec -it cicd-postgres psql -U atulp -d testdb

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM pipelines;
SELECT COUNT(*) FROM alerts;
```

## 🔍 Monitoring and Logs

### View Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Real-time logs
docker-compose logs -f --tail=100
```

### Container Status
```bash
# Check running containers
docker-compose ps

# Check resource usage
docker stats

# Check container health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :5000

# Stop conflicting services
sudo systemctl stop nginx  # if using port 80
sudo systemctl stop postgresql  # if using port 5432
```

#### 2. Database Connection Issues
```bash
# Check database container
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### 3. Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

#### 4. Backend API Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check environment variables
docker exec cicd-backend env | grep DB_
```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down

# Remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=testdb
DB_USER=atulp
DB_PASSWORD=atulp123

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Custom Ports

Edit `docker-compose.yml` to change ports:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 80 to 8080
  
  backend:
    ports:
      - "3000:5000"  # Change 5000 to 3000
  
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

## 📊 Performance Optimization

### Resource Limits
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose up -d --scale backend=3 --scale frontend=2
```

## 🔒 Security Considerations

### Production Deployment
1. Change default passwords
2. Use secrets management
3. Enable SSL/TLS
4. Configure firewall rules
5. Regular security updates

### Secrets Management
```bash
# Create secrets
echo "your-secret-password" | docker secret create db_password -

# Use in docker-compose.yml
services:
  postgres:
    secrets:
      - db_password
```

## 📈 Monitoring and Alerting

### Health Checks
All services include health checks that can be monitored:

```bash
# Check health status
docker-compose ps

# Monitor health
watch docker-compose ps
```

### Log Aggregation
```bash
# Collect logs
docker-compose logs --no-color > app.log

# Monitor logs in real-time
docker-compose logs -f | grep ERROR
```

## 🎯 Success Criteria

After deployment, verify:

✅ **Frontend accessible** at http://localhost:80  
✅ **Backend API responding** at http://localhost:5000/health  
✅ **Database connected** and tables created  
✅ **WebSocket working** for real-time updates  
✅ **Sample data loaded** (8 pipelines, 3 alerts)  
✅ **All health checks passing**  

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify container status: `docker-compose ps`
3. Check resource usage: `docker stats`
4. Review this documentation
5. Check the main README.md for additional information
