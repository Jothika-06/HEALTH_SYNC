import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { LogHealth } from './pages/LogHealth';
import { HealthHistory } from './pages/HealthHistory';
import { Chat } from './pages/Chat';
import { DoctorCheckups } from './pages/DoctorCheckups';
import { DoctorChat } from './pages/DoctorChat';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#121212',
              border: '1px solid #F2F2F2',
              borderRadius: '8px',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace />} 
          />
          <Route 
            path="/signup" 
            element={!user ? <Signup /> : <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace />} 
          />
          
          {/* Protected patient routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="patient">
              <Layout>
                <PatientDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/log" element={
            <ProtectedRoute requiredRole="patient">
              <Layout>
                <LogHealth />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute requiredRole="patient">
              <Layout>
                <HealthHistory />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute requiredRole="patient">
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Protected doctor routes */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute requiredRole="doctor">
              <Layout>
                <DoctorDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/checkups" element={
            <ProtectedRoute requiredRole="doctor">
              <Layout>
                <DoctorCheckups />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/chat/:patientId" element={
            <ProtectedRoute requiredRole="doctor">
              <Layout>
                <DoctorChat />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={
            user ? (
              <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;