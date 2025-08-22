const { Pool } = require('pg');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.File({ filename: 'logs/database-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/database-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'testdb',
  user: process.env.DB_USER || 'atulp',
  password: process.env.DB_PASSWORD || 'atulp123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Setup database tables
async function setupDatabase() {
  try {
    const client = await pool.connect();
    
    // Create pipelines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pipelines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'running', 'pending')),
        build_time INTEGER,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        logs TEXT,
        trigger_type VARCHAR(50) DEFAULT 'manual',
        branch VARCHAR(255),
        commit_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        pipeline_id INTEGER REFERENCES pipelines(id),
        metric_type VARCHAR(50) NOT NULL,
        metric_value DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        pipeline_id INTEGER REFERENCES pipelines(id),
        alert_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create alert_configs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alert_configs (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        slack_enabled BOOLEAN DEFAULT false,
        email_enabled BOOLEAN DEFAULT false,
        recipients TEXT[],
        conditions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default alert configurations
    await client.query(`
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
        updated_at = CURRENT_TIMESTAMP
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
      CREATE INDEX IF NOT EXISTS idx_pipelines_created_at ON pipelines(created_at);
      CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics(created_at);
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    `);

    client.release();
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error setting up database:', error);
    throw error;
  }
}

// Helper function to execute queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error:', error);
    throw error;
  }
}

// Helper function to get a client from the pool
async function getClient() {
  return await pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  setupDatabase,
  logger
};
