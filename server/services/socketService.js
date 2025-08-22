const { pool } = require('../database/connection');

function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Send initial data
        sendInitialData(socket);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        // Handle pipeline updates
        socket.on('pipeline_update', async (data) => {
            try {
                // Broadcast to all clients
                io.emit('pipeline_updated', data);
            } catch (error) {
                console.error('Error handling pipeline update:', error);
            }
        });

        // Handle metrics requests
        socket.on('get_metrics', async () => {
            try {
                const metrics = await getLatestMetrics();
                socket.emit('metrics_data', metrics);
            } catch (error) {
                console.error('Error getting metrics:', error);
            }
        });
    });

    // Broadcast pipeline updates periodically
    setInterval(async () => {
        try {
            const latestPipelines = await getLatestPipelines();
            io.emit('pipelines_update', latestPipelines);
        } catch (error) {
            console.error('Error broadcasting pipelines:', error);
        }
    }, 30000); // Every 30 seconds
}

async function sendInitialData(socket) {
    try {
        const [pipelines, metrics] = await Promise.all([
            getLatestPipelines(),
            getLatestMetrics()
        ]);

        socket.emit('initial_data', {
            pipelines,
            metrics
        });
    } catch (error) {
        console.error('Error sending initial data:', error);
    }
}

async function getLatestPipelines() {
    const query = `
        SELECT * FROM pipelines 
        ORDER BY created_at DESC 
        LIMIT 10
    `;
    
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting latest pipelines:', error);
        return [];
    }
}

async function getLatestMetrics() {
    const query = `
        SELECT * FROM metrics 
        ORDER BY created_at DESC 
        LIMIT 1
    `;
    
    try {
        const result = await pool.query(query);
        return result.rows[0] || {};
    } catch (error) {
        console.error('Error getting latest metrics:', error);
        return {};
    }
}

module.exports = {
    initializeSocket
};
