import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Droplets, 
  Heart, 
  Moon, 
  Plus, 
  Calendar,
  TrendingUp,
  Clock,
  MessageCircle
} from 'lucide-react';
import { supabase, type HealthLog, type Checkup } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

export function PatientDashboard() {
  const { user } = useAuth();
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<Checkup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHealthLogs();
      fetchUpcomingCheckups();
    }
  }, [user]);

  const fetchHealthLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(7);

      if (error) throw error;
      setHealthLogs(data || []);
    } catch (error) {
      console.error('Error fetching health logs:', error);
    }
  };

  const fetchUpcomingCheckups = async () => {
    try {
      const { data, error } = await supabase
        .from('checkups')
        .select(`
          *,
          doctor:users!checkups_doctor_id_fkey(full_name)
        `)
        .eq('patient_id', user?.id)
        .eq('status', 'upcoming')
        .order('date', { ascending: true });

      if (error) throw error;
      setUpcomingCheckups(data || []);
    } catch (error) {
      console.error('Error fetching checkups:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestMetrics = () => {
    if (healthLogs.length === 0) {
      return {
        steps: 0,
        water: 0,
        heartRate: 0,
        sleep: 0,
      };
    }

    const latest = healthLogs[0];
    return {
      steps: latest.steps,
      water: latest.water_ml,
      heartRate: latest.heart_rate,
      sleep: latest.sleep_hours,
    };
  };

  const getAverageMetrics = () => {
    if (healthLogs.length === 0) return null;

    const totals = healthLogs.reduce(
      (acc, log) => ({
        steps: acc.steps + log.steps,
        water: acc.water + log.water_ml,
        heartRate: acc.heartRate + log.heart_rate,
        sleep: acc.sleep + log.sleep_hours,
      }),
      { steps: 0, water: 0, heartRate: 0, sleep: 0 }
    );

    const count = healthLogs.length;
    return {
      steps: Math.round(totals.steps / count),
      water: Math.round(totals.water / count),
      heartRate: Math.round(totals.heartRate / count),
      sleep: Math.round((totals.sleep / count) * 10) / 10,
    };
  };

  const metrics = getLatestMetrics();
  const averages = getAverageMetrics();

  const healthCards = [
    {
      title: 'Steps Walked',
      value: metrics.steps.toLocaleString(),
      average: averages ? `Avg: ${averages.steps.toLocaleString()}` : '',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Water Intake',
      value: `${metrics.water} ml`,
      average: averages ? `Avg: ${averages.water} ml` : '',
      icon: Droplets,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Heart Rate',
      value: `${metrics.heartRate} bpm`,
      average: averages ? `Avg: ${averages.heartRate} bpm` : '',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Sleep Hours',
      value: `${metrics.sleep}h`,
      average: averages ? `Avg: ${averages.sleep}h` : '',
      icon: Moon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#6C63FF] to-[#5A52E8] rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
        <p className="text-white/80 mb-6">Here's your health overview for today</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/log">
            <motion.button
              className="bg-white text-[#6C63FF] px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-4 w-4" />
              <span>Log Health Data</span>
            </motion.button>
          </Link>
          <Link to="/chat">
            <motion.button
              className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat with Doctor</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-[#9E9E9E]" />
              </div>
              <h3 className="text-[#9E9E9E] text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-[#121212] mb-1">{card.value}</p>
              {card.average && (
                <p className="text-xs text-[#9E9E9E]">{card.average}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming Checkups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#121212] flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#6C63FF]" />
            <span>Upcoming Checkups</span>
          </h2>
          <Link to="/history" className="text-[#6C63FF] hover:underline text-sm font-medium">
            View All
          </Link>
        </div>

        {upcomingCheckups.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
            <p className="text-[#9E9E9E]">No upcoming checkups scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingCheckups.slice(0, 3).map((checkup) => (
              <div
                key={checkup.id}
                className="flex items-center justify-between p-4 bg-[#F2F2F2] rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-[#6C63FF] rounded-lg">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#121212]">{checkup.purpose}</h3>
                    <p className="text-sm text-[#9E9E9E]">
                      Dr. {checkup.doctor?.full_name} • {format(new Date(checkup.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#121212]">
                    {format(new Date(checkup.date), 'h:mm a')}
                  </p>
                  <p className="text-xs text-[#9E9E9E]">
                    {format(new Date(checkup.date), 'EEE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Link to="/log" className="group">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2] hover:shadow-md transition-all group-hover:border-[#6C63FF]">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#121212]">Log Health Data</h3>
                <p className="text-sm text-[#9E9E9E]">Record your daily metrics</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/history" className="group">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2] hover:shadow-md transition-all group-hover:border-[#6C63FF]">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#121212]">View History</h3>
                <p className="text-sm text-[#9E9E9E]">Track your progress</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/chat" className="group">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2] hover:shadow-md transition-all group-hover:border-[#6C63FF]">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-[#121212]">Chat with Doctor</h3>
                <p className="text-sm text-[#9E9E9E]">Get medical advice</p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}