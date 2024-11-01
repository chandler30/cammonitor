import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CameraStats {
  cameraId: number;
  cameraName: string;
  uptime: number;
  incidents: number;
  responseTime: number;
  lastIncident: string;
  status: 'online' | 'offline';
}

interface DailyStats {
  day: string;
  uptime: number;
  incidents: number;
  avgResponseTime: number;
}

interface CameraTypeStats {
  type: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Statistics() {
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([]);
  const [cameraStats, setCameraStats] = useState<CameraStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    averageUptime: 0,
    totalIncidents: 0,
    averageResponseTime: 0,
  });
  const [cameraTypes, setCameraTypes] = useState<CameraTypeStats[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const [statsResponse, typesResponse] = await Promise.all([
          axios.get(`http://localhost:5001/api/cameras/stats?range=${selectedTimeRange}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/cameras/types', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const stats = statsResponse.data.data;
        processStats(stats);
        setCameraTypes(typesResponse.data.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const processStats = (stats: any) => {
    setCameraStats(stats.cameraStats);
    setWeeklyData(stats.dailyStats);
    setOverallStats(stats.overallStats);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Statistics</h2>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-lg font-medium text-gray-900">Average Uptime</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">
            {overallStats.averageUptime.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">System reliability</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-lg font-medium text-gray-900">Total Incidents</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">
            {overallStats.totalIncidents}
          </p>
          <p className="text-sm text-gray-500 mt-1">Detected issues</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-lg font-medium text-gray-900">Response Time</h3>
          <p className="text-3xl font-bold text-blue-500 mt-2">
            {overallStats.averageResponseTime.toFixed(0)}ms
          </p>
          <p className="text-sm text-gray-500 mt-1">Average latency</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance Trends
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="uptime"
                stroke="#4ade80"
                name="Uptime %"
              />
              <Line
                type="monotone"
                dataKey="incidents"
                stroke="#f87171"
                name="Incidents"
              />
              <Line
                type="monotone"
                dataKey="avgResponseTime"
                stroke="#60a5fa"
                name="Avg Response Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Camera Types Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Camera Types Distribution
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={cameraTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={150}
                fill="#8884d8"
                dataKey="count"
              >
                {cameraTypes.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Camera Stats Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Camera Performance Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Camera
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incidents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Incident
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cameraStats.map((camera) => (
                <tr key={camera.cameraId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {camera.cameraName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        camera.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {camera.uptime.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {camera.incidents}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {camera.responseTime}ms
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {camera.lastIncident
                        ? new Date(camera.lastIncident).toLocaleString()
                        : 'No incidents'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}