const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');

// Get all metrics with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      metric_type, 
      pipeline_id, 
      start_date, 
      end_date 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params = [];
    let paramCount = 0;

    if (metric_type) {
      whereClause += `WHERE metric_type = $${++paramCount}`;
      params.push(metric_type);
    }

    if (pipeline_id) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `pipeline_id = $${++paramCount}`;
      params.push(pipeline_id);
    }

    if (start_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `created_at >= $${++paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `created_at <= $${++paramCount}`;
      params.push(end_date);
    }

    const metricsQuery = `
      SELECT m.*, p.name as pipeline_name 
      FROM metrics m
      LEFT JOIN pipelines p ON m.pipeline_id = p.id
      ${whereClause}
      ORDER BY m.created_at DESC 
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM metrics m ${whereClause}
    `;

    params.push(parseInt(limit), offset);

    const [metricsResult, countResult] = await Promise.all([
      query(metricsQuery, params.slice(0, -2).concat([parseInt(limit), offset])),
      query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      metrics: metricsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Create new metric
router.post('/', async (req, res) => {
  try {
    const { pipeline_id, metric_type, metric_value } = req.body;

    if (!metric_type || metric_value === undefined) {
      return res.status(400).json({ error: 'Metric type and value are required' });
    }

    const result = await query(`
      INSERT INTO metrics (pipeline_id, metric_type, metric_value)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [pipeline_id, metric_type, metric_value]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating metric:', error);
    res.status(500).json({ error: 'Failed to create metric' });
  }
});

// Get success/failure rate
router.get('/success-rate', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_pipelines,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        ROUND(
          (COUNT(CASE WHEN status = 'success' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
        ) as success_rate
      FROM pipelines 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);

    const data = result.rows[0];
    res.json({
      total_pipelines: parseInt(data.total_pipelines),
      successful: parseInt(data.successful),
      failed: parseInt(data.failed),
      success_rate: parseFloat(data.success_rate) || 0,
      failure_rate: 100 - (parseFloat(data.success_rate) || 0)
    });
  } catch (error) {
    console.error('Error fetching success rate:', error);
    res.status(500).json({ error: 'Failed to fetch success rate' });
  }
});

// Get average build time
router.get('/avg-build-time', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await query(`
      SELECT 
        AVG(build_time) as avg_build_time,
        MIN(build_time) as min_build_time,
        MAX(build_time) as max_build_time,
        COUNT(*) as total_builds
      FROM pipelines 
      WHERE build_time IS NOT NULL 
      AND created_at >= NOW() - INTERVAL '${days} days'
    `);

    const data = result.rows[0];
    res.json({
      avg_build_time: parseFloat(data.avg_build_time) || 0,
      min_build_time: parseInt(data.min_build_time) || 0,
      max_build_time: parseInt(data.max_build_time) || 0,
      total_builds: parseInt(data.total_builds) || 0
    });
  } catch (error) {
    console.error('Error fetching average build time:', error);
    res.status(500).json({ error: 'Failed to fetch average build time' });
  }
});

// Get metrics summary for dashboard
router.get('/dashboard-summary', async (req, res) => {
  try {
    const [successRate, buildTime, recentActivity, alerts] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_pipelines,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'running' THEN 1 END) as running,
          CASE
            WHEN COUNT(*) = 0 THEN 0.00
            ELSE ROUND(
              (COUNT(CASE WHEN status = 'success' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
            )
          END as success_rate
        FROM pipelines 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `),
      query(`
        SELECT 
          AVG(build_time) as avg_build_time,
          MIN(build_time) as min_build_time,
          MAX(build_time) as max_build_time
        FROM pipelines 
        WHERE build_time IS NOT NULL 
        AND created_at >= NOW() - INTERVAL '24 hours'
      `),
      query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM pipelines 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY status
      `),
      query(`
        SELECT COUNT(*) as pending_alerts
        FROM alerts 
        WHERE status = 'pending'
      `)
    ]);

    res.json({
      success_rate: successRate.rows[0],
      build_time: buildTime.rows[0],
      recent_activity: recentActivity.rows,
      pending_alerts: parseInt(alerts.rows[0].pending_alerts)
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

module.exports = router;
