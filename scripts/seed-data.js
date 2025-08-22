const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'testdb',
  user: process.env.DB_USER || 'atulp',
  password: process.env.DB_PASSWORD || 'atulp123',
});

const samplePipelines = [
  {
    name: 'Frontend Build Pipeline',
    status: 'success',
    build_time: 180,
    trigger_type: 'push',
    branch: 'main',
    commit_hash: 'abc123def456',
    logs: '✅ Build successful\n📦 Package created\n🚀 Deployed to staging'
  },
  {
    name: 'Backend API Tests',
    status: 'success',
    build_time: 120,
    trigger_type: 'pull_request',
    branch: 'feature/new-api',
    commit_hash: 'def456ghi789',
    logs: '🧪 Tests passed: 156/156\n📊 Coverage: 89.5%\n✅ All checks passed'
  },
  {
    name: 'Database Migration',
    status: 'failed',
    build_time: 45,
    trigger_type: 'manual',
    branch: 'main',
    commit_hash: 'ghi789jkl012',
    logs: '❌ Migration failed\n💥 Error: Table already exists\n🔧 Rollback completed'
  },
  {
    name: 'Mobile App Build',
    status: 'running',
    build_time: 300,
    trigger_type: 'tag',
    branch: 'release/v2.1.0',
    commit_hash: 'jkl012mno345',
    logs: '🔄 Building iOS app...\n📱 Compiling Swift code\n⏳ 75% complete'
  },
  {
    name: 'Security Scan',
    status: 'success',
    build_time: 90,
    trigger_type: 'schedule',
    branch: 'main',
    commit_hash: 'mno345pqr678',
    logs: '🔒 Security scan completed\n✅ No vulnerabilities found\n📋 Report generated'
  },
  {
    name: 'Performance Tests',
    status: 'success',
    build_time: 240,
    trigger_type: 'push',
    branch: 'main',
    commit_hash: 'pqr678stu901',
    logs: '⚡ Performance tests passed\n📈 Response time: 150ms\n🎯 Load test: 1000 users'
  },
  {
    name: 'Docker Image Build',
    status: 'failed',
    build_time: 60,
    trigger_type: 'manual',
    branch: 'main',
    commit_hash: 'stu901vwx234',
    logs: '🐳 Building Docker image\n❌ Build failed: Out of disk space\n💾 Cleanup required'
  },
  {
    name: 'Documentation Build',
    status: 'success',
    build_time: 30,
    trigger_type: 'push',
    branch: 'docs/update',
    commit_hash: 'vwx234yza567',
    logs: '📚 Documentation built\n🌐 Deployed to docs site\n✅ Links validated'
  }
];

const sampleAlerts = [
  {
    pipeline_id: null,
    alert_type: 'pipeline_failure',
    message: 'Database Migration pipeline failed! Check logs for details.',
    status: 'sent'
  },
  {
    pipeline_id: null,
    alert_type: 'build_time_threshold',
    message: 'Docker Image Build exceeded time threshold (60s > 30s)',
    status: 'sent'
  },
  {
    pipeline_id: null,
    alert_type: 'success_rate_drop',
    message: 'Pipeline success rate dropped to 75% (below 80% threshold)',
    status: 'pending'
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');

    // Clear existing data
    await pool.query('DELETE FROM alerts');
    await pool.query('DELETE FROM metrics');
    await pool.query('DELETE FROM pipelines');

    // Insert sample pipelines
    console.log('📦 Inserting sample pipelines...');
    for (const pipeline of samplePipelines) {
      const result = await pool.query(`
        INSERT INTO pipelines (name, status, build_time, trigger_type, branch, commit_hash, logs)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [pipeline.name, pipeline.status, pipeline.build_time, pipeline.trigger_type, pipeline.branch, pipeline.commit_hash, pipeline.logs]);
      
      // Insert corresponding metrics
      await pool.query(`
        INSERT INTO metrics (pipeline_id, metric_type, metric_value)
        VALUES ($1, $2, $3)
      `, [result.rows[0].id, 'build_time', pipeline.build_time]);

      if (pipeline.status === 'success') {
        await pool.query(`
          INSERT INTO metrics (pipeline_id, metric_type, metric_value)
          VALUES ($1, $2, $3)
        `, [result.rows[0].id, 'success', 1]);
      } else if (pipeline.status === 'failed') {
        await pool.query(`
          INSERT INTO metrics (pipeline_id, metric_type, metric_value)
          VALUES ($1, $2, $3)
        `, [result.rows[0].id, 'success', 0]);
      }
    }

    // Insert sample alerts
    console.log('🔔 Inserting sample alerts...');
    for (const alert of sampleAlerts) {
      await pool.query(`
        INSERT INTO alerts (pipeline_id, alert_type, message, status, sent_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        alert.pipeline_id, 
        alert.alert_type, 
        alert.message, 
        alert.status,
        alert.status === 'sent' ? new Date() : null
      ]);
    }

    console.log('✅ Data seeding completed successfully!');
    console.log(`📊 Created ${samplePipelines.length} sample pipelines`);
    console.log(`🔔 Created ${sampleAlerts.length} sample alerts`);

    // Show summary
    const pipelineCount = await pool.query('SELECT COUNT(*) FROM pipelines');
    const alertCount = await pool.query('SELECT COUNT(*) FROM alerts');
    const metricCount = await pool.query('SELECT COUNT(*) FROM metrics');

    console.log('\n📈 Database Summary:');
    console.log(`- Pipelines: ${pipelineCount.rows[0].count}`);
    console.log(`- Alerts: ${alertCount.rows[0].count}`);
    console.log(`- Metrics: ${metricCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
