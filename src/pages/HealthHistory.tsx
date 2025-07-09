import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Droplets, 
  Heart, 
  Moon, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, type HealthLog } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

export function HealthHistory() {
  const { user } = useAuth();
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<'steps' | 'water_ml' | 'heart_rate' | 'sleep_hours'>('steps');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    if (user) {
      fetchHealthLogs();
    }
  }, [user]);

  useEffect(() => {
    filterLogs();
  }, [healthLogs, searchQuery, dateRange]);

  const fetchHealthLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setHealthLogs(data || []);
    } catch (error) {
      console.error('Error fetching health logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...healthLogs];

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(log => log.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(log => log.date <= dateRange.end);
    }

    // Search filter (smart search)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        // Natural language search
        if (query.includes('low sleep') || query.includes('tired')) {
          return log.sleep_hours < 7;
        }
        if (query.includes('high heart rate') || query.includes('fast heart')) {
          return log.heart_rate > 80;
        }
        if (query.includes('low water') || query.includes('dehydrated')) {
          return log.water_ml < 2000;
        }
        if (query.includes('low steps') || query.includes('inactive')) {
          return log.steps < 5000;
        }
        
        // Regular text search in notes
        return log.notes?.toLowerCase().includes(query) || 
               format(new Date(log.date), 'MMM dd, yyyy').toLowerCase().includes(query);
      });
    }

    setFilteredLogs(filtered);
  };

  const getChartData = () => {
    return filteredLogs
      .slice(0, 30)
      .reverse()
      .map(log => ({
        date: format(new Date(log.date), 'MMM dd'),
        value: log[selectedMetric],
      }));
  };

  const getMetricStats = () => {
    if (filteredLogs.length === 0) return null;

    const values = filteredLogs.map(log => log[selectedMetric]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Calculate trend (comparing first half vs second half)
    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half);
    const secondHalf = values.slice(half);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg ? 'up' : 'down';

    return { avg, max, min, trend };
  };

  const metrics = [
    { key: 'steps', label: 'Steps', icon: Activity, color: 'text-blue-600', unit: '' },
    { key: 'water_ml', label: 'Water', icon: Droplets, color: 'text-cyan-600', unit: 'ml' },
    { key: 'heart_rate', label: 'Heart Rate', icon: Heart, color: 'text-red-600', unit: 'bpm' },
    { key: 'sleep_hours', label: 'Sleep', icon: Moon, color: 'text-purple-600', unit: 'h' },
  ];

  const stats = getMetricStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#121212] mb-2">Health History</h1>
          <p className="text-[#9E9E9E]">Track your progress over time</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9E9E9E]" />
            <input
              type="text"
              placeholder="Search (e.g., 'low sleep days', 'high heart rate')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
            />
          </div>

          {/* Date Range */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="flex-1 px-3 py-2 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="flex-1 px-3 py-2 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchQuery('');
              setDateRange({ start: '', end: '' });
            }}
            className="px-4 py-2 text-[#9E9E9E] hover:text-[#121212] hover:bg-[#F2F2F2] rounded-lg transition-colors flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </motion.div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
      >
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedMetric === metric.key
                    ? 'bg-[#6C63FF] text-white'
                    : 'bg-[#F2F2F2] text-[#9E9E9E] hover:text-[#121212]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{metric.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-[#9E9E9E]">Average</p>
              <p className="text-lg font-bold text-[#121212]">
                {Math.round(stats.avg * 10) / 10}
                {metrics.find(m => m.key === selectedMetric)?.unit}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#9E9E9E]">Maximum</p>
              <p className="text-lg font-bold text-[#121212]">
                {stats.max}
                {metrics.find(m => m.key === selectedMetric)?.unit}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#9E9E9E]">Minimum</p>
              <p className="text-lg font-bold text-[#121212]">
                {stats.min}
                {metrics.find(m => m.key === selectedMetric)?.unit}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#9E9E9E]">Trend</p>
              <div className="flex items-center justify-center space-x-1">
                {stats.trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  stats.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.trend === 'up' ? 'Improving' : 'Declining'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" />
              <XAxis dataKey="date" stroke="#9E9E9E" fontSize={12} />
              <YAxis stroke="#9E9E9E" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #F2F2F2',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#6C63FF" 
                strokeWidth={2}
                dot={{ fill: '#6C63FF', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6C63FF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-[#F2F2F2] overflow-hidden"
      >
        <div className="p-6 border-b border-[#F2F2F2]">
          <h2 className="text-xl font-bold text-[#121212]">Detailed History</h2>
          <p className="text-[#9E9E9E]">
            Showing {filteredLogs.length} of {healthLogs.length} entries
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F2F2F2]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                  Steps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                  Water (ml)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                  Heart Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                  Sleep (h)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2F2]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F2F2F2]/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#121212]">
                    {format(new Date(log.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9E9E9E]">
                    {log.steps.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9E9E9E]">
                    {log.water_ml}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9E9E9E]">
                    {log.heart_rate} bpm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9E9E9E]">
                    {log.sleep_hours}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9E9E9E] max-w-xs truncate">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
            <p className="text-[#9E9E9E]">No health logs found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}