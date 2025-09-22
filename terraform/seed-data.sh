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

