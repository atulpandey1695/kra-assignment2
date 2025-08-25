# CI/CD Pipeline Health Dashboard

A real-time monitoring dashboard for CI/CD pipelines with automated alerting and comprehensive metrics visualization.

## 🚀 Features

### Core Functionality
- **Real-time Pipeline Monitoring**: Live status updates via WebSocket connections
- **Comprehensive Metrics**: Success rates, build times, and performance analytics
- **Automated Alerting**: Configurable alerts for failures, timeouts, and performance drops
- **Modern UI**: Responsive React frontend with Tailwind CSS served via **Nginx**
- **Database Persistence**: PostgreSQL for reliable data storage
- **RESTful API**: Complete backend API for pipeline management

### Dashboard Features
- ✅ **Success/Failure Rate Tracking**
- 🕒 **Average Build Time Monitoring**
- 📊 **Real-time Metrics Visualization**
- 🔔 **Alert Management System**
- 📈 **Performance Trends Analysis**
- 🔍 **Pipeline Logs Viewer**

### Alerting System
- **Pipeline Failures**: Immediate notifications on build failures
- **Build Time Thresholds**: Alerts when builds exceed time limits
- **Success Rate Drops**: Notifications when success rates fall below thresholds
- **Multiple Channels**: Slack integration (configurable)

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ React Frontend  │    │ Node.js Backend │    │  PostgreSQL DB  │
│  (Port 8080)    │◄──►│   (Port 5000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Socket.IO     │◄─────────────┘
                        │  Real-time      │
                        │  Communication  │
                        └─────────────────┘
```
- **Nginx** acts as a reverse proxy:
  - Serves React frontend build on port `8080`
  - Proxies API requests from `/api/` to backend (`:5000`)
  - Proxies WebSocket connections (`/socket.io/`)

### Technology Stack

#### Backend
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Socket.IO** - Real-time communication
- **Winston** - Logging
- **Cron** - Scheduled tasks
- **Nodemailer** - Email notifications
- **Slack Web API** - Slack integration

#### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Socket.IO Client** - Real-time updates
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

#### DevOps & Monitoring
- **Docker + Nginx** - Containerized deployment
- **GitHub Actions** - CI/CD pipeline
- **GCP VM (Self-hosted Runner)** - Workflow execution & metrics ingestion
- **Slack Integration** - Pipeline status notifications
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Compression** - Response optimization
- **Morgan** - HTTP request logging

## 🛠️ Installation & Setup

### Docker + Nginx Deployment

1. Build and run containers:
```bash
docker-compose up --build -d
```

2. Nginx Proxy Config Example:
```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://backend:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Access URLs:
- **Frontend** → http://localhost:8080  
- **Backend API** → http://localhost/api  
- **WebSockets** → ws://localhost/socket.io/

## 🤖 CI/CD Workflow

### GitHub Actions + GCP VM (Self-hosted Runner)
- CI/CD workflow runs on a **GCP VM self-hosted runner**
- Steps:
  - Install dependencies & run tests
  - Build Docker images
  - Push to container registry
  - Deploy containers to VM
  - Ingest CI/CD pipeline metrics

### Slack Integration
- Pipeline success/failure notifications are sent to configured Slack channel
- Includes:
  - ✅ Frontend URL (http://localhost:8080)
  - ⚙️ Backend API URL (http://localhost/api)
  - ❌ Error details (on failure)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
