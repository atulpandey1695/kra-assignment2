#!/bin/bash

# CI/CD Dashboard Startup Script - TEMPLATE VERSION
# This script installs Docker, Docker Compose, deploys the application, 
# seeds data, starts live metrics, and configures Slack notifications

set -e

# Log everything to a file for debugging
exec > >(tee -a /var/log/startup-script.log)
exec 2>&1

echo "=== CI/CD Dashboard Startup Script Started ==="
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo "Working directory: $(pwd)"

# Update system packages (minimal)
echo "=== Updating system packages ==="
apt-get update -y
apt-get install -y curl wget jq bc

# Install Docker using the official script (fastest method)
echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
chmod +x get-docker.sh
./get-docker.sh
rm get-docker.sh

# Start and enable Docker
echo "=== Starting Docker service ==="
systemctl start docker
systemctl enable docker

# Install Docker Compose (standalone)
echo "=== Installing Docker Compose ==="
DOCKER_COMPOSE_VERSION="2.21.0"
curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
echo "=== Verifying installations ==="
docker --version
docker-compose --version

# Create application directory
echo "=== Creating application directory ==="
mkdir -p /opt/cicd-dashboard
cd /opt/cicd-dashboard

# Create docker-compose.yml
echo "=== Creating docker-compose.yml ==="
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: cicd-postgres
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: atulp
      POSTGRES_PASSWORD: atulp123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U atulp -d testdb"]
      interval: 5s
      timeout: 3s
      retries: 3
    networks:
      - cicd-network

  redis:
    image: redis:7-alpine
    container_name: cicd-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
    networks:
      - cicd-network

  backend:
    image: atul1695/cicd-dashboard-backend:latest
    container_name: cicd-backend
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=testdb
      - DB_USER=atulp
      - DB_PASSWORD=atulp123
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - cicd-network

  frontend:
    image: atul1695/cicd-dashboard-frontend:latest
    container_name: cicd-frontend
    environment:
      - REACT_APP_API_BASE_URL=http://backend:5000
    ports:
      - "8080:80"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - cicd-network        

volumes:
  postgres_data:

networks:
  cicd-network:
    driver: bridge
EOF

# Create init-db.sql
echo "=== Creating init-db.sql ==="
mkdir -p ./init-db
cat > ./init-db/init-db.sql << 'EOF'
-- Database initialization script for CI/CD Dashboard
-- This script will be executed when the PostgreSQL container starts

-- Create database if not exists
SELECT 'CREATE DATABASE testdb'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'testdb')\gexec

-- Connect to the database
\c testdb;

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    build_time INTEGER,
    trigger_type VARCHAR(50) DEFAULT 'manual',
    branch VARCHAR(100) DEFAULT 'main',
    commit_hash VARCHAR(100),
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_configs table
CREATE TABLE IF NOT EXISTS alert_configs (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) UNIQUE NOT NULL,
    slack_enabled BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT false,
    recipients TEXT[],
    conditions JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipelines_created_at ON pipelines(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_pipeline_id ON metrics(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Insert default alert configurations
INSERT INTO alert_configs (alert_type, slack_enabled, email_enabled, recipients, conditions)
VALUES 
    ('pipeline_failure', true, true, ARRAY['devops@company.com'], '{"status": "failed"}'),
    ('build_time_threshold', true, false, ARRAY['devops@company.com'], '{"build_time_minutes": 30}'),
    ('success_rate_drop', true, true, ARRAY['devops@company.com'], '{"success_rate_threshold": 80}'),
    ('deployment_success', true, false, ARRAY['devops@company.com'], '{"status": "deployed"}'),
    ('deployment_failure', true, false, ARRAY['devops@company.com'], '{"status": "failed"}')
ON CONFLICT (alert_type) DO UPDATE SET
    slack_enabled = EXCLUDED.slack_enabled,
    email_enabled = EXCLUDED.email_enabled,
    recipients = EXCLUDED.recipients,
    conditions = EXCLUDED.conditions,
    updated_at = CURRENT_TIMESTAMP;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configs_updated_at BEFORE UPDATE ON alert_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE testdb TO atulp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO atulp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO atulp;
EOF

# Update docker-compose.yml to use local files
echo "=== Updating docker-compose.yml for local deployment ==="
sed -i 's|./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql|./init-db/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql|g' docker-compose.yml

# Create environment file
echo "=== Creating environment file ==="
cat > .env << 'EOF'
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=testdb
DB_USER=atulp
DB_PASSWORD=atulp123
REDIS_HOST=redis
REDIS_PORT=6379
REACT_APP_API_BASE_URL=http://localhost:5000
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
EOF

# Create data seeding script
echo "=== Creating data seeding script ==="
cat > seed-data.sh << 'EOF'
#!/bin/bash

# Data Seeding Script for CI/CD Dashboard
# This script populates the database with sample data for live metrics

set -e

echo "🌱 Seeding CI/CD Dashboard with sample data..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is accessible
echo "🔍 Checking database connection..."
docker-compose exec -T postgres pg_isready -U atulp -d testdb

# Insert sample pipeline data
echo "📊 Inserting sample pipeline data..."

# Sample pipelines with different statuses
docker-compose exec -T postgres psql -U atulp -d testdb -c "
INSERT INTO pipelines (name, status, build_time, trigger_type, branch, commit_hash, logs) VALUES
('Frontend Build', 'success', 120, 'push', 'main', 'abc123', 'Build completed successfully'),
('Backend Tests', 'success', 85, 'pull_request', 'feature/auth', 'def456', 'All tests passed'),
('API Deployment', 'success', 200, 'manual', 'main', 'ghi789', 'Deployed to production'),
('Database Migration', 'failed', 45, 'push', 'main', 'jkl012', 'Migration failed: connection timeout'),
('Security Scan', 'success', 180, 'schedule', 'main', 'mno345', 'No vulnerabilities found'),
('E2E Tests', 'running', 0, 'push', 'feature/ui', 'pqr678', 'Running end-to-end tests...'),
('Performance Tests', 'success', 300, 'manual', 'main', 'stu901', 'Performance within acceptable limits'),
('Code Quality Check', 'success', 60, 'pull_request', 'feature/api', 'vwx234', 'Code quality score: 95/100'),
('Docker Build', 'failed', 90, 'push', 'main', 'yza567', 'Docker build failed: out of memory'),
('Integration Tests', 'success', 150, 'push', 'main', 'bcd890', 'Integration tests passed');
"

# Insert sample metrics data
echo "📈 Inserting sample metrics data..."

# Get pipeline IDs and insert metrics
docker-compose exec -T postgres psql -U atulp -d testdb -c "
INSERT INTO metrics (pipeline_id, metric_type, metric_value) VALUES
(1, 'build_time', 120),
(1, 'success_rate', 100.0),
(2, 'build_time', 85),
(2, 'success_rate', 100.0),
(3, 'build_time', 200),
(3, 'success_rate', 100.0),
(4, 'build_time', 45),
(4, 'success_rate', 0.0),
(5, 'build_time', 180),
(5, 'success_rate', 100.0),
(6, 'build_time', 0),
(6, 'success_rate', 0.0),
(7, 'build_time', 300),
(7, 'success_rate', 100.0),
(8, 'build_time', 60),
(8, 'success_rate', 100.0),
(9, 'build_time', 90),
(9, 'success_rate', 0.0),
(10, 'build_time', 150),
(10, 'success_rate', 100.0);
"

# Insert sample alerts
echo "🚨 Inserting sample alerts..."

docker-compose exec -T postgres psql -U atulp -d testdb -c "
INSERT INTO alerts (pipeline_id, alert_type, message, status, sent_at) VALUES
(4, 'pipeline_failure', 'Database Migration failed: connection timeout', 'sent', NOW()),
(9, 'pipeline_failure', 'Docker Build failed: out of memory', 'sent', NOW()),
(6, 'pipeline_running', 'E2E Tests is running for more than 5 minutes', 'pending', NULL);
"

# Update some pipelines to show recent activity
echo "🔄 Updating recent pipeline activity..."

docker-compose exec -T postgres psql -U atulp -d testdb -c "
UPDATE pipelines SET 
    status = 'success',
    build_time = 75,
    updated_at = NOW() - INTERVAL '5 minutes'
WHERE id = 6;

UPDATE pipelines SET 
    updated_at = NOW() - INTERVAL '10 minutes'
WHERE id IN (1, 2, 3);

UPDATE pipelines SET 
    updated_at = NOW() - INTERVAL '15 minutes'
WHERE id IN (5, 7, 8);

UPDATE pipelines SET 
    updated_at = NOW() - INTERVAL '20 minutes'
WHERE id IN (4, 9, 10);
"

# Insert additional metrics for the last 24 hours
echo "📊 Inserting historical metrics..."

docker-compose exec -T postgres psql -U atulp -d testdb -c "
INSERT INTO metrics (pipeline_id, metric_type, metric_value, created_at) VALUES
(1, 'cpu_usage', 45.2, NOW() - INTERVAL '1 hour'),
(1, 'memory_usage', 67.8, NOW() - INTERVAL '1 hour'),
(2, 'cpu_usage', 38.5, NOW() - INTERVAL '2 hours'),
(2, 'memory_usage', 52.3, NOW() - INTERVAL '2 hours'),
(3, 'cpu_usage', 72.1, NOW() - INTERVAL '3 hours'),
(3, 'memory_usage', 89.4, NOW() - INTERVAL '3 hours'),
(4, 'cpu_usage', 95.8, NOW() - INTERVAL '4 hours'),
(4, 'memory_usage', 98.2, NOW() - INTERVAL '4 hours'),
(5, 'cpu_usage', 41.7, NOW() - INTERVAL '5 hours'),
(5, 'memory_usage', 58.9, NOW() - INTERVAL '5 hours');
"

echo "✅ Data seeding completed!"
echo ""
echo "📊 Sample data inserted:"
echo "  - 10 sample pipelines"
echo "  - 30+ metrics records"
echo "  - 3 sample alerts"
echo "  - Historical data for last 24 hours"
echo ""
echo "🌐 Refresh your dashboard to see the data!"
echo "   URL: http://$(curl -s ifconfig.me):8080"
EOF

chmod +x seed-data.sh

# Create live metrics generator
echo "=== Creating live metrics generator ==="
cat > live-metrics-generator.sh << 'EOF'
#!/bin/bash

# Live Metrics Generator for CI/CD Dashboard
# This script generates real-time metrics and updates the dashboard

set -e

echo "📊 Starting Live Metrics Generator..."

# Function to generate random pipeline data
generate_pipeline() {
    local statuses=("success" "failed" "running" "pending")
    local names=("Frontend Build" "Backend Tests" "API Deployment" "Database Migration" "Security Scan" "E2E Tests" "Performance Tests" "Code Quality Check" "Docker Build" "Integration Tests")
    local branches=("main" "develop" "feature/auth" "feature/ui" "feature/api" "hotfix/bug-fix")
    local triggers=("push" "pull_request" "manual" "schedule")
    
    local name=${names[$RANDOM % ${#names[@]}]}
    local status=${statuses[$RANDOM % ${#statuses[@]}]}
    local branch=${branches[$RANDOM % ${#branches[@]}]}
    local trigger=${triggers[$RANDOM % ${#triggers[@]}]}
    local build_time=$((RANDOM % 300 + 30))  # 30-330 seconds
    local commit_hash=$(openssl rand -hex 6)
    
    echo "🔄 Generating pipeline: $name ($status)"
    
    # Insert pipeline
    docker-compose exec -T postgres psql -U atulp -d testdb -c "
    INSERT INTO pipelines (name, status, build_time, trigger_type, branch, commit_hash, logs, created_at, updated_at) 
    VALUES ('$name', '$status', $build_time, '$trigger', '$branch', '$commit_hash', 'Generated by live metrics', NOW(), NOW());
    "
    
    # Get the pipeline ID
    local pipeline_id=$(docker-compose exec -T postgres psql -U atulp -d testdb -t -c "SELECT id FROM pipelines ORDER BY id DESC LIMIT 1;" | tr -d ' ')
    
    # Insert metrics
    docker-compose exec -T postgres psql -U atulp -d testdb -c "
    INSERT INTO metrics (pipeline_id, metric_type, metric_value, created_at) VALUES
    ($pipeline_id, 'build_time', $build_time, NOW()),
    ($pipeline_id, 'success_rate', $(if [ "$status" = "success" ]; then echo "100.0"; else echo "0.0"; fi), NOW()),
    ($pipeline_id, 'cpu_usage', $(echo "scale=1; $RANDOM % 100" | bc), NOW()),
    ($pipeline_id, 'memory_usage', $(echo "scale=1; $RANDOM % 100" | bc), NOW());
    "
    
    # Generate alert if failed
    if [ "$status" = "failed" ]; then
        docker-compose exec -T postgres psql -U atulp -d testdb -c "
        INSERT INTO alerts (pipeline_id, alert_type, message, status, sent_at) 
        VALUES ($pipeline_id, 'pipeline_failure', '$name failed: Build error', 'sent', NOW());
        "
    fi
}

# Function to update existing pipelines
update_pipelines() {
    echo "🔄 Updating existing pipelines..."
    
    # Update running pipelines
    docker-compose exec -T postgres psql -U atulp -d testdb -c "
    UPDATE pipelines 
    SET status = CASE 
        WHEN RANDOM() < 0.7 THEN 'success'
        WHEN RANDOM() < 0.9 THEN 'failed'
        ELSE 'running'
    END,
    build_time = CASE 
        WHEN status = 'running' THEN build_time + 10
        ELSE build_time
    END,
    updated_at = NOW()
    WHERE status = 'running' AND updated_at < NOW() - INTERVAL '2 minutes';
    "
    
    # Update pending pipelines
    docker-compose exec -T postgres psql -U atulp -d testdb -c "
    UPDATE pipelines 
    SET status = 'running',
    updated_at = NOW()
    WHERE status = 'pending' AND updated_at < NOW() - INTERVAL '1 minute';
    "
}

# Function to generate system metrics
generate_system_metrics() {
    echo "📈 Generating system metrics..."
    
    # Get random pipeline ID
    local pipeline_id=$(docker-compose exec -T postgres psql -U atulp -d testdb -t -c "SELECT id FROM pipelines ORDER BY RANDOM() LIMIT 1;" | tr -d ' ')
    
    if [ ! -z "$pipeline_id" ] && [ "$pipeline_id" != " " ]; then
        docker-compose exec -T postgres psql -U atulp -d testdb -c "
        INSERT INTO metrics (pipeline_id, metric_type, metric_value, created_at) VALUES
        ($pipeline_id, 'cpu_usage', $(echo "scale=1; $RANDOM % 100" | bc), NOW()),
        ($pipeline_id, 'memory_usage', $(echo "scale=1; $RANDOM % 100" | bc), NOW()),
        ($pipeline_id, 'disk_usage', $(echo "scale=1; $RANDOM % 100" | bc), NOW()),
        ($pipeline_id, 'network_io', $(echo "scale=1; $RANDOM % 1000" | bc), NOW());
        "
    fi
}

# Function to clean old data
cleanup_old_data() {
    echo "🧹 Cleaning up old data..."
    
    # Remove metrics older than 7 days
    docker-compose exec -T postgres psql -U atulp -d testdb -c "
    DELETE FROM metrics WHERE created_at < NOW() - INTERVAL '7 days';
    "
    
    # Remove old alerts
    docker-compose exec -T postgres psql -U atulp -d testdb -c "
    DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '3 days';
    "
}

# Main loop
echo "🚀 Starting live metrics generation..."
echo "Press Ctrl+C to stop"

# Initial data seeding
echo "🌱 Seeding initial data..."
for i in {1..5}; do
    generate_pipeline
    sleep 2
done

# Main metrics generation loop
while true; do
    echo "⏰ $(date): Generating metrics..."
    
    # Update existing pipelines
    update_pipelines
    
    # Generate new pipeline (20% chance)
    if [ $((RANDOM % 5)) -eq 0 ]; then
        generate_pipeline
    fi
    
    # Generate system metrics
    generate_system_metrics
    
    # Cleanup old data (10% chance)
    if [ $((RANDOM % 10)) -eq 0 ]; then
        cleanup_old_data
    fi
    
    # Wait before next iteration
    sleep 30
done
EOF

chmod +x live-metrics-generator.sh

# Create Slack notification script
echo "=== Creating Slack notification script ==="
cat > slack-notification.sh << 'EOF'
#!/bin/bash

# Slack Notification Script for CI/CD Dashboard
# This script sends deployment status to Slack

set -e

SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
PUBLIC_IP=$(curl -s ifconfig.me)
DASHBOARD_URL="http://${PUBLIC_IP}:8080"
API_URL="http://${PUBLIC_IP}:5000"

# Function to send Slack notification
send_slack_notification() {
    local status=$1
    local message=$2
    local color=$3
    
    if [ -z "$SLACK_WEBHOOK_URL" ] || [ "$SLACK_WEBHOOK_URL" = "" ]; then
        echo "⚠️  SLACK_WEBHOOK_URL not set, skipping Slack notification"
        return
    fi
    
    local payload=$(cat <<EOF
{
    "text": "🚀 CI/CD Dashboard Deployment Update",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "Status",
                    "value": "$status",
                    "short": true
                },
                {
                    "title": "Dashboard URL",
                    "value": "<$DASHBOARD_URL|Open Dashboard>",
                    "short": true
                },
                {
                    "title": "API Health",
                    "value": "<$API_URL/health|Check API>",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                }
            ],
            "footer": "CI/CD Dashboard",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL"
    
    echo "📤 Slack notification sent: $status"
}

# Check deployment status
check_deployment_status() {
    echo "🔍 Checking deployment status..."
    
    # Check if all containers are running
    local containers_running=$(docker-compose ps --services --filter "status=running" | wc -l)
    local total_containers=4
    
    if [ "$containers_running" -eq "$total_containers" ]; then
        # Check API health
        if curl -f "$API_URL/health" > /dev/null 2>&1; then
            # Check if data exists
            local pipeline_count=$(docker-compose exec -T postgres psql -U atulp -d testdb -t -c "SELECT COUNT(*) FROM pipelines;" | tr -d ' ')
            
            if [ "$pipeline_count" -gt 0 ]; then
                send_slack_notification "✅ SUCCESS" "CI/CD Dashboard deployed successfully with live data! Pipeline count: $pipeline_count" "good"
                return 0
            else
                send_slack_notification "⚠️  PARTIAL SUCCESS" "CI/CD Dashboard deployed but no data found. Seeding data..." "warning"
                return 1
            fi
        else
            send_slack_notification "❌ FAILED" "CI/CD Dashboard deployed but API is not responding" "danger"
            return 1
        fi
    else
        send_slack_notification "❌ FAILED" "CI/CD Dashboard deployment failed. Only $containers_running/$total_containers containers running" "danger"
        return 1
    fi
}

# Main execution
echo "🚀 Starting CI/CD Dashboard deployment notification..."

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check deployment status
if check_deployment_status; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed or incomplete"
    exit 1
fi
EOF

chmod +x slack-notification.sh

# Start the application
echo "=== Starting CI/CD Dashboard ==="
docker-compose pull
docker-compose up -d

# Wait for services to start
echo "=== Waiting for services to start ==="
sleep 15

# Check service status
echo "=== Checking service status ==="
docker-compose ps

# Seed initial data
echo "=== Seeding initial data ==="
./seed-data.sh

# Start live metrics generator in background
echo "=== Starting live metrics generator ==="
nohup ./live-metrics-generator.sh > metrics.log 2>&1 &

# Send Slack notification
echo "=== Sending Slack notification ==="
./slack-notification.sh

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo "=== CI/CD Dashboard Setup Complete ==="
echo "Public IP: $PUBLIC_IP"
echo "Application URL: http://$PUBLIC_IP:8080"
echo "Backend API: http://$PUBLIC_IP:5000"
echo "Health Check: http://$PUBLIC_IP:5000/health"
echo ""
echo "📊 Live metrics are now running in the background"
echo "📤 Slack notifications have been sent"
echo ""
echo "To check logs: docker-compose logs -f"
echo "To restart: docker-compose restart"
echo "To monitor: ./monitor.sh"

echo "=== Startup Script Completed Successfully ==="
echo "Timestamp: $(date)"

