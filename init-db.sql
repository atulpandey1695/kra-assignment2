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
    ('success_rate_drop', true, true, ARRAY['devops@company.com'], '{"success_rate_threshold": 80}')
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
