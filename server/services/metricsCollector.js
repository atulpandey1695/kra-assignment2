const { pool } = require('../database/connection');

function startMetricsCollector() {
    // Collect metrics every 5 minutes
    setInterval(async () => {
        try {
            await collectMetrics();
        } catch (error) {
            console.error('Error collecting metrics:', error);
        }
    }, 5 * 60 * 1000);

    // Initial collection
    collectMetrics();
}

async function collectMetrics() {
    try {
        const metrics = await calculateMetrics();
        await storeMetrics(metrics);
        console.log('Metrics collected and stored');
    } catch (error) {
        console.error('Error in metrics collection:', error);
    }
}

async function calculateMetrics() {
    const query = `
        SELECT 
            COUNT(*) as total_pipelines,
            COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_pipelines,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_pipelines,
            AVG(build_time) as avg_build_time,
            MAX(created_at) as last_build_time
        FROM pipelines 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    try {
        const result = await pool.query(query);
        const data = result.rows[0];

        return {
            total_pipelines: parseInt(data.total_pipelines) || 0,
            successful_pipelines: parseInt(data.successful_pipelines) || 0,
            failed_pipelines: parseInt(data.failed_pipelines) || 0,
            success_rate: data.total_pipelines > 0 ? 
                Math.round((data.successful_pipelines / data.total_pipelines) * 100) : 0,
            avg_build_time: Math.round(parseFloat(data.avg_build_time) || 0),
            last_build_time: data.last_build_time,
            created_at: new Date()
        };
    } catch (error) {
        console.error('Error calculating metrics:', error);
        return {
            total_pipelines: 0,
            successful_pipelines: 0,
            failed_pipelines: 0,
            success_rate: 0,
            avg_build_time: 0,
            last_build_time: null,
            created_at: new Date()
        };
    }
}

async function storeMetrics(metrics) {
    // Store aggregate values as simple metrics rows (metric_type, metric_value)
    // to match the existing schema.
    const insertQuery = `INSERT INTO metrics (metric_type, metric_value) VALUES ($1, $2)`;
    const rows = [
        ['total_pipelines_24h', metrics.total_pipelines],
        ['successful_pipelines_24h', metrics.successful_pipelines],
        ['failed_pipelines_24h', metrics.failed_pipelines],
        ['success_rate_24h', metrics.success_rate],
        ['avg_build_time_24h', metrics.avg_build_time]
    ];

    try {
        for (const [type, value] of rows) {
            await pool.query(insertQuery, [type, value]);
        }
    } catch (error) {
        console.error('Error storing metrics:', error);
    }
}

module.exports = {
    startMetricsCollector
};
