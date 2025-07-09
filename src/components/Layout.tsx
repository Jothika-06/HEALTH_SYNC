import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  LogOut, 
  User, 
  MessageCircle, 
  Calendar,
  Activity,
  Users,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/login');
    }
  };

  const getNavItems = () => {
    if (user?.role === 'doctor') {
      return [
        { path: '/doctor/dashboard', label: 'Dashboard', icon: Activity },
        { path: '/doctor/checkups', label: 'Checkups', icon: Calendar },
      ];
    } else {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: Activity },
        { path: '/log', label: 'Log Data', icon: ClipboardList },
        { path: '/history', label: 'History', icon: User },
        { path: '/chat', label: 'Chat', icon: MessageCircle },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#F2F2F2] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'}>
              <motion.div 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="h-8 w-8 text-[#6C63FF]" />
                <span className="text-xl font-bold text-[#121212]">HealthSync</span>
              </motion.div>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#6C63FF] text-white'
                        : 'text-[#9E9E9E] hover:text-[#121212] hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#6C63FF] rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#121212]">{user?.full_name}</p>
                  <p className="text-xs text-[#9E9E9E] capitalize">{user?.role}</p>
                </div>
              </div>
              <motion.button
                onClick={handleSignOut}
                className="p-2 text-[#9E9E9E] hover:text-[#121212] hover:bg-[#F2F2F2] rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-[#F2F2F2]">
        <div className="flex overflow-x-auto px-4 py-2 space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#6C63FF] text-white'
                    : 'text-[#9E9E9E] hover:text-[#121212] hover:bg-[#F2F2F2]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}