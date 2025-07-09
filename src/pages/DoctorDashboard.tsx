import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  Calendar, 
  MessageCircle,
  TrendingUp,
  Heart,
  Droplets,
  Moon,
  AlertCircle
} from 'lucide-react';
import { supabase, type User, type HealthLog, type Checkup } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

export function DoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [patientHealthLogs, setPatientHealthLogs] = useState<HealthLog[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<Checkup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchUpcomingCheckups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientHealthLogs(selectedPatient.id);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_links')
        .select(`
          patient:users!doctor_patient_links_patient_id_fkey(*)
        `)
        .eq('doctor_id', user?.id);

      if (error) throw error;
      const patientList = data.map(link => link.patient);
      setPatients(patientList);
      if (patientList.length > 0) {
        setSelectedPatient(patientList[0]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHealthLogs = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('user_id', patientId)
        .order('date', { ascending: false })
        .limit(7);

      if (error) throw error;
      setPatientHealthLogs(data || []);
    } catch (error) {
      console.error('Error fetching patient health logs:', error);
    }
  };

  const fetchUpcomingCheckups = async () => {
    try {
      const { data, error } = await supabase
        .from('checkups')
        .select(`
          *,
          patient:users!checkups_patient_id_fkey(full_name)
        `)
        .eq('doctor_id', user?.id)
        .eq('status', 'upcoming')
        .order('date', { ascending: true });

      if (error) throw error;
      setUpcomingCheckups(data || []);
    } catch (error) {
      console.error('Error fetching checkups:', error);
    }
  };

  const getPatientMetrics = () => {
    if (patientHealthLogs.length === 0) {
      return {
        steps: 0,
        water: 0,
        heartRate: 0,
        sleep: 0,
      };
    }

    const latest = patientHealthLogs[0];
    return {
      steps: latest.steps,
      water: latest.water_ml,
      heartRate: latest.heart_rate,
      sleep: latest.sleep_hours,
    };
  };

  const getHealthAlerts = () => {
    if (patientHealthLogs.length === 0) return [];

    const latest = patientHealthLogs[0];
    const alerts = [];

    if (latest.heart_rate > 100) {
      alerts.push({ type: 'warning', message: 'High heart rate detected' });
    }
    if (latest.sleep_hours < 6) {
      alerts.push({ type: 'warning', message: 'Insufficient sleep' });
    }
    if (latest.water_ml < 1500) {
      alerts.push({ type: 'info', message: 'Low water intake' });
    }
    if (latest.steps < 5000) {
      alerts.push({ type: 'info', message: 'Low activity level' });
    }

    return alerts;
  };

  const metrics = getPatientMetrics();
  const alerts = getHealthAlerts();

  const healthCards = [
    {
      title: 'Steps',
      value: metrics.steps.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Water',
      value: `${metrics.water} ml`,
      icon: Droplets,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Heart Rate',
      value: `${metrics.heartRate} bpm`,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Sleep',
      value: `${metrics.sleep}h`,
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
        <h1 className="text-3xl font-bold mb-2">Welcome, Dr. {user?.full_name}!</h1>
        <p className="text-white/80 mb-6">Monitor your patients' health and manage checkups</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/doctor/checkups">
            <motion.button
              className="bg-white text-[#6C63FF] px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar className="h-4 w-4" />
              <span>Manage Checkups</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
        >
          <h2 className="text-xl font-bold text-[#121212] mb-6 flex items-center space-x-2">
            <Users className="h-5 w-5 text-[#6C63FF]" />
            <span>My Patients</span>
          </h2>

          {patients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
              <p className="text-[#9E9E9E]">No patients assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedPatient?.id === patient.id
                      ? 'bg-[#6C63FF] text-white'
                      : 'bg-[#F2F2F2] hover:bg-[#E8E8E8] text-[#121212]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPatient?.id === patient.id ? 'bg-white/20' : 'bg-[#6C63FF]'
                    }`}>
                      <Users className={`h-5 w-5 ${
                        selectedPatient?.id === patient.id ? 'text-white' : 'text-white'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{patient.full_name}</p>
                      <p className={`text-sm ${
                        selectedPatient?.id === patient.id ? 'text-white/70' : 'text-[#9E9E9E]'
                      }`}>
                        {patient.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Patient Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#121212]">{selectedPatient.full_name}</h3>
                    <p className="text-[#9E9E9E]">Patient Health Overview</p>
                  </div>
                  <Link to={`/doctor/chat/${selectedPatient.id}`}>
                    <motion.button
                      className="bg-[#6C63FF] text-white px-4 py-2 rounded-lg hover:bg-[#5A52E8] transition-colors flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat</span>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              {/* Health Alerts */}
              {alerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
                >
                  <h4 className="text-lg font-bold text-[#121212] mb-4 flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span>Health Alerts</span>
                  </h4>
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg flex items-center space-x-2 ${
                          alert.type === 'warning' 
                            ? 'bg-orange-50 text-orange-800' 
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Health Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {healthCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="bg-white rounded-xl p-4 shadow-sm border border-[#F2F2F2]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                          <Icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                        <TrendingUp className="h-3 w-3 text-[#9E9E9E]" />
                      </div>
                      <h4 className="text-[#9E9E9E] text-xs font-medium mb-1">{card.title}</h4>
                      <p className="text-lg font-bold text-[#121212]">{card.value}</p>
                    </div>
                  );
                })}
              </motion.div>

              {/* Recent Health Logs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
              >
                <h4 className="text-lg font-bold text-[#121212] mb-4">Recent Health Logs</h4>
                {patientHealthLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
                    <p className="text-[#9E9E9E]">No health logs available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientHealthLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-[#F2F2F2] rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-[#121212]">
                            {format(new Date(log.date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-[#9E9E9E]">
                            {log.steps} steps • {log.water_ml}ml water • {log.heart_rate} bpm • {log.sleep_hours}h sleep
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-[#F2F2F2] text-center"
            >
              <Users className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#121212] mb-2">Select a Patient</h3>
              <p className="text-[#9E9E9E]">Choose a patient from the list to view their health data</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Upcoming Checkups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#121212] flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#6C63FF]" />
            <span>Upcoming Checkups</span>
          </h2>
          <Link to="/doctor/checkups" className="text-[#6C63FF] hover:underline text-sm font-medium">
            Manage All
          </Link>
        </div>

        {upcomingCheckups.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
            <p className="text-[#9E9E9E]">No upcoming checkups scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingCheckups.slice(0, 6).map((checkup) => (
              <div
                key={checkup.id}
                className="p-4 bg-[#F2F2F2] rounded-lg"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-[#6C63FF] rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#121212]">{checkup.patient?.full_name}</h4>
                    <p className="text-sm text-[#9E9E9E]">{checkup.purpose}</p>
                  </div>
                </div>
                <p className="text-sm text-[#9E9E9E]">
                  {format(new Date(checkup.date), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}