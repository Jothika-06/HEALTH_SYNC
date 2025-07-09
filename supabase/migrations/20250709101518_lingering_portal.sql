/*
  # HealthSync Database Schema

  1. New Tables
    - `users` - Extended user profiles with roles
    - `health_logs` - Patient health data tracking
    - `doctor_patient_links` - Doctor-patient relationships
    - `messages` - Chat system between doctors and patients
    - `checkups` - Scheduled checkups and reminders

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Doctors can only access assigned patients
    - Patients can only access their own data

  3. Demo Data
    - Create demo doctor and patient accounts
    - Sample health logs and checkups for testing
*/

-- Extend users table with healthcare-specific fields
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('doctor', 'patient')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Health logs for patient data tracking
CREATE TABLE IF NOT EXISTS health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  steps integer DEFAULT 0,
  water_ml integer DEFAULT 0,
  heart_rate integer DEFAULT 0,
  sleep_hours decimal(3,1) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Link doctors to their assigned patients
CREATE TABLE IF NOT EXISTS doctor_patient_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, patient_id)
);

-- Messages for doctor-patient communication
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Checkup scheduling and management
CREATE TABLE IF NOT EXISTS checkups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date timestamptz NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkups ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Health logs policies
CREATE POLICY "Patients can manage own health logs"
  ON health_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view assigned patients' health logs"
  ON health_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_links dpl
      JOIN users u ON u.id = dpl.doctor_id
      WHERE dpl.patient_id = health_logs.user_id
      AND dpl.doctor_id = auth.uid()
      AND u.role = 'doctor'
    )
  );

-- Doctor-patient links policies
CREATE POLICY "Doctors can view their patient links"
  ON doctor_patient_links FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can view their doctor links"
  ON doctor_patient_links FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Checkups policies
CREATE POLICY "Doctors can manage checkups for their patients"
  ON checkups FOR ALL
  TO authenticated
  USING (
    doctor_id = auth.uid() OR
    (patient_id = auth.uid() AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'patient'
    ))
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON health_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checkups_patient_date ON checkups(patient_id, date);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_links_doctor ON doctor_patient_links(doctor_id);

-- Insert demo data
INSERT INTO users (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'doctor@gmail.com', 'Dr. Sarah Johnson', 'doctor'),
  ('22222222-2222-2222-2222-222222222222', 'patient@gmail.com', 'John Smith', 'patient')
ON CONFLICT (email) DO NOTHING;

-- Link demo doctor to demo patient
INSERT INTO doctor_patient_links (doctor_id, patient_id) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (doctor_id, patient_id) DO NOTHING;

-- Sample health logs for demo patient
INSERT INTO health_logs (user_id, date, steps, water_ml, heart_rate, sleep_hours) VALUES
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day', 8500, 2000, 72, 7.5),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '2 days', 6200, 1800, 68, 8.0),
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '3 days', 9100, 2200, 75, 6.5)
ON CONFLICT DO NOTHING;

-- Sample checkup for demo
INSERT INTO checkups (doctor_id, patient_id, date, purpose, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 
   CURRENT_DATE + INTERVAL '7 days', 'Regular Health Checkup', 'upcoming')
ON CONFLICT DO NOTHING;