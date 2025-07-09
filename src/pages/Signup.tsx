import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff, UserCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      navigate('/login');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6C63FF]/5 to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <motion.div
              className="flex justify-center mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="h-12 w-12 text-[#6C63FF]" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#121212] mb-2">Join HealthSync</h1>
            <p className="text-[#9E9E9E]">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    role === 'patient'
                      ? 'border-[#6C63FF] bg-[#6C63FF]/5'
                      : 'border-[#F2F2F2] hover:border-[#6C63FF]/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserCheck className="h-6 w-6 mx-auto mb-2 text-[#6C63FF]" />
                  <span className="text-sm font-medium text-[#121212]">Patient</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    role === 'doctor'
                      ? 'border-[#6C63FF] bg-[#6C63FF]/5'
                      : 'border-[#F2F2F2] hover:border-[#6C63FF]/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Stethoscope className="h-6 w-6 mx-auto mb-2 text-[#6C63FF]" />
                  <span className="text-sm font-medium text-[#121212]">Doctor</span>
                </motion.button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#121212] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-[#F2F2F2] rounded-lg focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-colors"
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9E9E9E] hover:text-[#121212]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6C63FF] text-white py-3 rounded-lg font-medium hover:bg-[#5A52E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[#9E9E9E]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#6C63FF] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}