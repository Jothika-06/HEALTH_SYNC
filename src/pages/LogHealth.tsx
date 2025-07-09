import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Droplets, Heart, Moon, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function LogHealth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: '',
    water_ml: '',
    heart_rate: '',
    sleep_hours: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('health_logs')
        .insert({
          user_id: user.id,
          date: formData.date,
          steps: parseInt(formData.steps) || 0,
          water_ml: parseInt(formData.water_ml) || 0,
          heart_rate: parseInt(formData.heart_rate) || 0,
          sleep_hours: parseFloat(formData.sleep_hours) || 0,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast.success('Health data logged successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error logging health data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const inputFields = [
    {
      label: 'Steps Walked',
      field: 'steps',
      type: 'number',
      placeholder: '10000',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Water Intake (ml)',
      field: 'water_ml',
      type: 'number',
      placeholder: '2000',
      icon: Droplets,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      label: 'Heart Rate (bpm)',
      field: 'heart_rate',
      type: 'number',
      placeholder: '72',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Sleep Hours',
      field: 'sleep_hours',
      type: 'number',
      step: '0.1',
      placeholder: '8.0',
      icon: Moon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-[#F2F2F2] p-8"
      >
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-[#F2F2F2] rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#9E9E9E]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Log Health Data</h1>
            <p className="text-[#9E9E9E]">Record your daily health metrics</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium text-[#121212] mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputFields.map((field) => {
              const Icon = field.icon;
              return (
                <motion.div
                  key={field.field}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-[#121212]">
                    {field.label}
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg ${field.bgColor}`}>
                      <Icon className={`h-4 w-4 ${field.color}`} />
                    </div>
                    <input
                      type={field.type}
                      step={field.step}
                      value={formData[field.field as keyof typeof formData]}
                      onChange={(e) => handleInputChange(field.field, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full pl-16 pr-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#121212] mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about your health today..."
              rows={4}
              className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C63FF] text-white py-3 rounded-lg font-medium hover:bg-[#5A52E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : 'Save Health Data'}</span>
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}