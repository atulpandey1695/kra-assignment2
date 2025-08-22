# CI/CD Pipeline Health Dashboard

A real-time monitoring dashboard for CI/CD pipelines with automated alerting and comprehensive metrics visualization.

## 🚀 Features

### Core Functionality
- **Real-time Pipeline Monitoring**: Live status updates via WebSocket connections
- **Comprehensive Metrics**: Success rates, build times, and performance analytics
- **Automated Alerting**: Configurable alerts for failures, timeouts, and performance drops
- **Modern UI**: Responsive React frontend with Tailwind CSS
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
- **Multiple Channels**: Slack and Email integration (configurable)

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │  PostgreSQL DB  │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Socket.IO     │◄─────────────┘
                        │  Real-time      │
                        │  Communication  │
                        └─────────────────┘
```

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
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Compression** - Response optimization
- **Morgan** - HTTP request logging

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **Git**: For version control
- **npm** or **yarn**: Package manager

### Port Requirements
- **Port 3000**: React development server
- **Port 5000**: Node.js backend server
- **Port 5432**: PostgreSQL database

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cicd-dashboard
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Database Setup
```bash
# Create database and user (as postgres user)
sudo -u postgres psql

CREATE DATABASE testdb;
CREATE USER atulp WITH PASSWORD 'atulp123';
GRANT ALL PRIVILEGES ON DATABASE testdb TO atulp;
\q
```

### 4. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env
```

### 5. Database Initialization
```bash
# Setup database tables
npm run setup-db

# Seed with sample data
npm run seed-data
```

### 6. Start the Application
```bash
# Development mode (both frontend and backend)
npm run dev-full

# Or start separately:
# Backend only
npm run server

# Frontend only
npm run client
```

## 🎯 Quick Start Guide

### 1. Verify Installation
```bash
# Check Node.js version
node --version  # Should be v18+

# Check PostgreSQL
psql --version  # Should be v12+

# Check ports availability
sudo netstat -tnlpu | grep -E '3000|5000|5432'
```

### 2. Start the Application
```bash
# Install all dependencies
npm run install-all

# Setup database
npm run setup-db

# Seed sample data
npm run seed-data

# Start in development mode
npm run dev-full
```

### 3. Access the Dashboard
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Pipelines
- `GET /pipelines` - List all pipelines
- `GET /pipelines/:id` - Get pipeline details
- `POST /pipelines` - Create new pipeline
- `PATCH /pipelines/:id/status` - Update pipeline status
- `GET /pipelines/:id/logs` - Get pipeline logs
- `DELETE /pipelines/:id` - Delete pipeline

#### Metrics
- `GET /metrics/dashboard-summary` - Dashboard metrics
- `GET /metrics/success-rate` - Success rate data
- `GET /metrics/avg-build-time` - Build time statistics
- `GET /metrics/trends` - Performance trends
- `GET /metrics/top-performers` - Top performing pipelines

#### Alerts
- `GET /alerts` - List all alerts
- `POST /alerts` - Create new alert
- `PATCH /alerts/:id/status` - Update alert status
- `GET /alerts/configs` - Get alert configurations
- `POST /alerts/test` - Test alert notifications

### WebSocket Events

#### Client to Server
- `join-dashboard` - Join dashboard room
- `join-pipeline` - Join specific pipeline room
- `pipeline-update` - Update pipeline status
- `metrics-update` - Update metrics

#### Server to Client
- `pipeline-status-changed` - Pipeline status update
- `metrics-changed` - Metrics update
- `new-alert` - New alert notification
- `system-status-update` - System status update

## 🔧 Configuration

### Environment Variables

#### Server Configuration
```env
PORT=5000
NODE_ENV=development
```

#### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=testdb
DB_USER=atulp
DB_PASSWORD=atulp123
```

#### Slack Integration (Optional)
```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C0123456789
```

#### Email Integration (Optional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

#### Security
```env
JWT_SECRET=your-super-secret-jwt-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

### Manual Testing
```bash
# Test backend health
curl http://localhost:5000/health

# Test API endpoints
curl http://localhost:5000/api/pipelines
curl http://localhost:5000/api/metrics/dashboard-summary
curl http://localhost:5000/api/alerts
```

### Real-time Testing
1. Open dashboard in browser
2. Check WebSocket connection status
3. Monitor real-time updates
4. Test alert notifications

## 📊 Dashboard Features

### Real-time Monitoring
- Live pipeline status updates
- Real-time metrics collection
- Instant alert notifications
- WebSocket-based communication

### Metrics Visualization
- Success/failure rate charts
- Build time trends
- Performance analytics
- Top performer rankings

### Alert Management
- Configurable alert rules
- Multiple notification channels
- Alert history tracking
- Alert status management

## 🚀 Deployment

### Production Setup
```bash
# Build frontend
npm run client-build

# Set production environment
export NODE_ENV=production

# Start production server
npm start
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting

#### Common Issues
1. **Port conflicts**: Check if ports 3000, 5000, 5432 are available
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **Node.js version**: Ensure you're using Node.js v18 or higher
4. **Dependencies**: Run `npm install` in both root and client directories

#### Getting Help
- Check the logs in the `logs/` directory
- Review the health check endpoint
- Verify environment variables
- Check database connectivity

### Contact
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the docs folder
- **Support**: Contact the development team

## 🔮 Roadmap

### Planned Features
- [ ] Advanced analytics dashboard
- [ ] Custom alert rules builder
- [ ] Pipeline templates
- [ ] Multi-tenant support
- [ ] API rate limiting dashboard
- [ ] Export functionality
- [ ] Mobile app
- [ ] Dark mode theme

### Performance Improvements
- [ ] Database query optimization
- [ ] Caching layer implementation
- [ ] CDN integration
- [ ] Load balancing support

---

**Built with ❤️ for DevOps teams**
