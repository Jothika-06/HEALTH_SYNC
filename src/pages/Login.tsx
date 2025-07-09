import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      // Navigation will be handled by the auth state change
    }

    setLoading(false);
  };

  const fillDemoCredentials = (role: 'doctor' | 'patient') => {
    if (role === 'doctor') {
      setEmail('doctor@gmail.com');
      setPassword('doctor123');
    } else {
      setEmail('patient@gmail.com');
      setPassword('patient123');
    }
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
            <h1 className="text-2xl font-bold text-[#121212] mb-2">Welcome to HealthSync</h1>
            <p className="text-[#9E9E9E]">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your password"
                  required
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
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="text-center text-sm text-[#9E9E9E] mb-4">
              Demo Credentials
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fillDemoCredentials('doctor')}
                className="flex-1 px-3 py-2 text-xs bg-[#F2F2F2] text-[#121212] rounded-lg hover:bg-[#E8E8E8] transition-colors"
              >
                Doctor Demo
              </button>
              <button
                onClick={() => fillDemoCredentials('patient')}
                className="flex-1 px-3 py-2 text-xs bg-[#F2F2F2] text-[#121212] rounded-lg hover:bg-[#E8E8E8] transition-colors"
              >
                Patient Demo
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[#9E9E9E]">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#6C63FF] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}