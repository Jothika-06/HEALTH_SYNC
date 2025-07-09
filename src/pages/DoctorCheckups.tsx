import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  Edit3
} from 'lucide-react';
import { supabase, type Checkup, type User as UserType } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function DoctorCheckups() {
  const { user } = useAuth();
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [patients, setPatients] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState<Checkup | null>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    date: '',
    time: '',
    purpose: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchCheckups();
      fetchPatients();
    }
  }, [user]);

  const fetchCheckups = async () => {
    try {
      const { data, error } = await supabase
        .from('checkups')
        .select(`
          *,
          patient:users!checkups_patient_id_fkey(full_name, email)
        `)
        .eq('doctor_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setCheckups(data || []);
    } catch (error) {
      console.error('Error fetching checkups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_links')
        .select(`
          patient:users!doctor_patient_links_patient_id_fkey(*)
        `)
        .eq('doctor_id', user?.id);

      if (error) throw error;
      setPatients(data.map(link => link.patient));
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const checkupData = {
      doctor_id: user.id,
      patient_id: formData.patient_id,
      date: `${formData.date}T${formData.time}:00`,
      purpose: formData.purpose,
      notes: formData.notes || null,
      status: 'upcoming' as const,
    };

    try {
      if (editingCheckup) {
        const { error } = await supabase
          .from('checkups')
          .update(checkupData)
          .eq('id', editingCheckup.id);

        if (error) throw error;
        toast.success('Checkup updated successfully!');
      } else {
        const { error } = await supabase
          .from('checkups')
          .insert(checkupData);

        if (error) throw error;
        toast.success('Checkup scheduled successfully!');
      }

      resetForm();
      fetchCheckups();
    } catch (error: any) {
      toast.error(error.message || 'Error saving checkup');
    }
  };

  const updateCheckupStatus = async (checkupId: string, status: 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('checkups')
        .update({ status })
        .eq('id', checkupId);

      if (error) throw error;
      toast.success(`Checkup ${status}!`);
      fetchCheckups();
    } catch (error: any) {
      toast.error(error.message || 'Error updating checkup');
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      date: '',
      time: '',
      purpose: '',
      notes: '',
    });
    setShowCreateForm(false);
    setEditingCheckup(null);
  };

  const startEdit = (checkup: Checkup) => {
    const checkupDate = new Date(checkup.date);
    setFormData({
      patient_id: checkup.patient_id,
      date: format(checkupDate, 'yyyy-MM-dd'),
      time: format(checkupDate, 'HH:mm'),
      purpose: checkup.purpose,
      notes: checkup.notes || '',
    });
    setEditingCheckup(checkup);
    setShowCreateForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

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
          <h1 className="text-3xl font-bold text-[#121212] mb-2">Manage Checkups</h1>
          <p className="text-[#9E9E9E]">Schedule and manage patient checkups</p>
        </div>
        <motion.button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#6C63FF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5A52E8] transition-colors flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Checkup</span>
        </motion.button>
      </motion.div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-[#F2F2F2]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#121212]">
              {editingCheckup ? 'Edit Checkup' : 'Schedule New Checkup'}
            </h2>
            <button
              onClick={resetForm}
              className="text-[#9E9E9E] hover:text-[#121212] transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Patient
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_id: e.target.value }))}
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                required
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Purpose
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="e.g., Regular Health Checkup"
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for the checkup..."
                rows={3}
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors resize-none"
              />
            </div>

            <div className="md:col-span-2 flex space-x-4">
              <motion.button
                type="submit"
                className="bg-[#6C63FF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5A52E8] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {editingCheckup ? 'Update Checkup' : 'Schedule Checkup'}
              </motion.button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-[#F2F2F2] text-[#9E9E9E] rounded-lg hover:bg-[#F2F2F2] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Checkups List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-[#F2F2F2] overflow-hidden"
      >
        <div className="p-6 border-b border-[#F2F2F2]">
          <h2 className="text-xl font-bold text-[#121212]">All Checkups</h2>
          <p className="text-[#9E9E9E]">
            {checkups.length} checkup{checkups.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {checkups.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
            <p className="text-[#9E9E9E]">No checkups scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2F2F2]">
            {checkups.map((checkup) => {
              const StatusIcon = getStatusIcon(checkup.status);
              return (
                <div key={checkup.id} className="p-6 hover:bg-[#F2F2F2]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-[#6C63FF]/10 rounded-lg">
                        <User className="h-6 w-6 text-[#6C63FF]" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#121212]">{checkup.patient?.full_name}</h3>
                        <p className="text-sm text-[#9E9E9E] mb-1">{checkup.purpose}</p>
                        <p className="text-sm text-[#9E9E9E]">
                          {format(new Date(checkup.date), 'MMM dd, yyyy • h:mm a')}
                        </p>
                        {checkup.notes && (
                          <p className="text-sm text-[#9E9E9E] mt-1">Notes: {checkup.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(checkup.status)}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="capitalize">{checkup.status}</span>
                      </span>

                      {checkup.status === 'upcoming' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(checkup)}
                            className="p-2 text-[#9E9E9E] hover:text-[#6C63FF] hover:bg-[#6C63FF]/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateCheckupStatus(checkup.id, 'completed')}
                            className="p-2 text-[#9E9E9E] hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateCheckupStatus(checkup.id, 'cancelled')}
                            className="p-2 text-[#9E9E9E] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}