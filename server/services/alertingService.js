const { pool } = require('../database/connection');

function startAlertingService() {
    // Check for alerts every 2 minutes
    setInterval(async () => {
        try {
            await checkAlerts();
        } catch (error) {
            console.error('Error checking alerts:', error);
        }
    }, 2 * 60 * 1000);

    // Initial check
    checkAlerts();
}

async function checkAlerts() {
    try {
        const alertConfigs = await getAlertConfigs();
        
        for (const config of alertConfigs) {
            await checkAlertCondition(config);
        }
    } catch (error) {
        console.error('Error in alert checking:', error);
    }
}

async function getAlertConfigs() {
    const query = 'SELECT * FROM alert_configs WHERE enabled = true';
    
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting alert configs:', error);
        return [];
    }
}

async function checkAlertCondition(config) {
    try {
        let shouldAlert = false;
        let alertMessage = '';

        // Parse thresholds from the JSONB `conditions` column
        const conditions = config.conditions || {};

        switch (config.alert_type) {
            case 'pipeline_failure':
                shouldAlert = await checkPipelineFailure();
                alertMessage = 'Pipeline failure detected';
                break;
            
            case 'build_time_threshold':
                // Expect conditions.build_time_minutes
                const buildThreshold = Number(conditions.build_time_minutes) || 30;
                shouldAlert = await checkBuildTimeThreshold(buildThreshold * 60);
                alertMessage = `Build time exceeded threshold: ${buildThreshold}m`;
                break;
            
            case 'success_rate_drop':
                // Expect conditions.success_rate_threshold
                const successThreshold = Number(conditions.success_rate_threshold) || 80;
                shouldAlert = await checkSuccessRateDrop(successThreshold);
                alertMessage = `Success rate dropped below: ${successThreshold}%`;
                break;
            
            default:
                console.log(`Unknown alert type: ${config.alert_type}`);
                return;
        }

        if (shouldAlert) {
            await createAlert(config.alert_type, alertMessage);
            console.log(`Alert created: ${alertMessage}`);
        }
    } catch (error) {
        console.error('Error checking alert condition:', error);
    }
}

async function checkPipelineFailure() {
    const query = `
        SELECT COUNT(*) as failed_count
        FROM pipelines 
        WHERE status = 'failed' 
        AND created_at >= NOW() - INTERVAL '10 minutes'
    `;
    
    try {
        const result = await pool.query(query);
        return parseInt(result.rows[0].failed_count) > 0;
    } catch (error) {
        console.error('Error checking pipeline failure:', error);
        return false;
    }
}

async function checkBuildTimeThreshold(threshold) {
    const query = `
        SELECT COUNT(*) as slow_count
        FROM pipelines 
        WHERE build_time > $1 
        AND created_at >= NOW() - INTERVAL '1 hour'
    `;
    
    try {
        const result = await pool.query(query, [threshold]);
        return parseInt(result.rows[0].slow_count) > 0;
    } catch (error) {
        console.error('Error checking build time threshold:', error);
        return false;
    }
}

async function checkSuccessRateDrop(threshold) {
    const query = `
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'success' THEN 1 END) as successful
        FROM pipelines 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;
    
    try {
        const result = await pool.query(query);
        const data = result.rows[0];
        const successRate = data.total > 0 ? (data.successful / data.total) * 100 : 100;
        return successRate < threshold;
    } catch (error) {
        console.error('Error checking success rate:', error);
        return false;
    }
}

async function createAlert(alertType, message) {
    const query = `
        INSERT INTO alerts (alert_type, message, created_at)
        VALUES ($1, $2, $3)
    `;
    
    try {
        await pool.query(query, [alertType, message, new Date()]);
    } catch (error) {
        console.error('Error creating alert:', error);
    }
}

module.exports = {
    startAlertingService
};
