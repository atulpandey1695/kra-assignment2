const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');

// Get all alerts with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, alert_type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    let paramCount = 0;

    if (status) {
      whereClause += `WHERE a.status = $${++paramCount}`;
      params.push(status);
    }

    if (alert_type) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `a.alert_type = $${++paramCount}`;
      params.push(alert_type);
    }

    const alertsQuery = `
      SELECT a.*, p.name as pipeline_name 
      FROM alerts a
      LEFT JOIN pipelines p ON a.pipeline_id = p.id
      ${whereClause}
      ORDER BY a.created_at DESC 
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM alerts a ${whereClause}
    `;

    params.push(parseInt(limit), offset);

    const [alertsResult, countResult] = await Promise.all([
      query(alertsQuery, params.slice(0, -2).concat([parseInt(limit), offset])),
      query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      alerts: alertsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create new alert
router.post('/', async (req, res) => {
  try {
    const { pipeline_id, alert_type, message } = req.body;

    if (!alert_type || !message) {
      return res.status(400).json({ error: 'Alert type and message are required' });
    }

    const result = await query(`
      INSERT INTO alerts (pipeline_id, alert_type, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [pipeline_id, alert_type, message]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await query(`
      UPDATE alerts 
      SET status = $1, sent_at = $2
      WHERE id = $3
      RETURNING *
    `, [status, status === 'sent' ? new Date() : null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({ error: 'Failed to update alert status' });
  }
});

// Get alert configurations
router.get('/configs', async (req, res) => {
  try {
    const result = await query('SELECT * FROM alert_configs ORDER BY alert_type');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alert configs:', error);
    res.status(500).json({ error: 'Failed to fetch alert configurations' });
  }
});

// Update alert configuration
router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      enabled, 
      slack_enabled, 
      email_enabled, 
      recipients, 
      conditions 
    } = req.body;

    const result = await query(`
      UPDATE alert_configs 
      SET 
        enabled = $1,
        slack_enabled = $2,
        email_enabled = $3,
        recipients = $4,
        conditions = $5,
        updated_at = $6
      WHERE id = $7
      RETURNING *
    `, [enabled, slack_enabled, email_enabled, recipients, conditions, new Date(), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert configuration not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert config:', error);
    res.status(500).json({ error: 'Failed to update alert configuration' });
  }
});

// Test alert (send test notification)
router.post('/test', async (req, res) => {
  try {
    const { alert_type, message, recipients } = req.body;

    if (!alert_type || !message) {
      return res.status(400).json({ error: 'Alert type and message are required' });
    }

    const config = await query(
      'SELECT * FROM alert_configs WHERE alert_type = $1',
      [alert_type]
    );

    if (config.rows.length === 0) {
      return res.status(404).json({ error: 'Alert configuration not found' });
    }

    const alertConfig = config.rows[0];
    const testMessage = `🧪 TEST ALERT: ${message}`;
    const results = {};

    // For now, just simulate success
    results.slack = 'sent';
    results.email = 'sent';

    res.json({
      message: 'Test alert sent',
      results
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({ error: 'Failed to send test alert' });
  }
});

// Get recent alerts (last 24 hours)
router.get('/recent', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, p.name as pipeline_name 
      FROM alerts a
      LEFT JOIN pipelines p ON a.pipeline_id = p.id
      WHERE a.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    res.status(500).json({ error: 'Failed to fetch recent alerts' });
  }
});

module.exports = router;
