import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'patient';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type HealthLog = {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  water_ml: number;
  heart_rate: number;
  sleep_hours: number;
  notes?: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: string;
  sender?: User;
  receiver?: User;
};

export type Checkup = {
  id: string;
  doctor_id: string;
  patient_id: string;
  date: string;
  purpose: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  doctor?: User;
  patient?: User;
};

export type DoctorPatientLink = {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
  doctor?: User;
  patient?: User;
};