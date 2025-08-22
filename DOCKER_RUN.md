# 🐳 Docker Run Instructions

## Quick Start
```bash
# 1. Build and start all services
docker-compose up -d --build

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f

# 4. Access application
# Frontend: http://localhost:80
# Backend: http://localhost:5000
```

## Testing
```bash
# Health checks
curl http://localhost:5000/health
curl http://localhost:80

# API tests
curl http://localhost:5000/api/pipelines
curl http://localhost:5000/api/metrics/dashboard-summary
```

## Troubleshooting
```bash
# Restart services
docker-compose restart

# Reset everything
docker-compose down -v
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Stop Application
```bash
docker-compose down
```
