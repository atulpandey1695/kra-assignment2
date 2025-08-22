import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { isConnected } = useSocket();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const metricsResponse = await fetch('/api/metrics/dashboard-summary');
        if (!metricsResponse.ok) {
          throw new Error('Failed to fetch dashboard summary');
        }
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError('Failed to load dashboard data.');
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full text-red-500">
        <AlertTriangle className="h-12 w-12" />
        <p className="mt-2 text-center">{error || 'Metrics data is not available.'}</p>
      </div>
    );
  }

  // Use data from the dashboard-summary API call
  const { success_rate, build_time, recent_activity } = metrics;
  
  const chartData = [
    { name: 'Success', value: success_rate.successful, color: '#10B981' },
    { name: 'Failed', value: success_rate.failed, color: '#EF4444' },
    { name: 'Running', value: success_rate.running, color: '#F59E0B' },
  ];
  
  // Prepare data for the Recent Build Times chart from recent_activity
  const recentBuildTimesData = recent_activity.map(item => ({
    status: item.status,
    count: parseInt(item.count, 10),
  }));

  return (
    // Main container with appropriate padding to clear the sidebar
    <div className="p-6 md:ml-64 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time CI/CD pipeline monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pipelines (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{success_rate.total_pipelines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{success_rate.success_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Build Time (24h)</p>
              <p className="text-2xl font-bold text-gray-900">
                {build_time.avg_build_time ? parseFloat(build_time.avg_build_time).toFixed(2) : '0.00'}s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed Pipelines (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{success_rate.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Pipeline Statuses (last hour)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentBuildTimesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Recent Pipelines - This section seems to be missing from the provided API, so it's commented out */}
      {/* <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Pipelines</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentPipelines.map((pipeline) => (
            <div key={pipeline.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{pipeline.name}</h4>
                  <p className="text-sm text-gray-500">
                    Branch: {pipeline.branch} | Commit: {pipeline.commit_hash}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{pipeline.build_time}s</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    pipeline.status === 'success' ? 'bg-green-100 text-green-800' :
                    pipeline.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pipeline.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> 
      */}
    </div>
  );
};

export default Dashboard;
