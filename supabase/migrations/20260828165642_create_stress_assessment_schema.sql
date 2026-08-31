/*
# Stress and Trauma Assessment Module Schema

## Overview
Creates the database schema for the AI-Based Real-Time Stress and Trauma Assessment Module
for victims/complainants accessing the National Helpline Against Atrocities (NHAA 14566).

## New Tables

### 1. profiles
- `id` (uuid, PK, references auth.users) — links to Supabase auth
- `full_name` (text) — victim/complainant name
- `location` (text) — geographic location (district/state)
- `preferred_language` (text) — preferred interface language
- `phone` (text, nullable) — optional phone number
- `created_at` (timestamptz) — account creation time
- `updated_at` (timestamptz) — last profile update

### 2. assessments
- `id` (uuid, PK) — unique assessment ID
- `user_id` (uuid, references auth.users) — who took the assessment
- `language` (text) — language used in the assessment
- `narrative_text` (text) — the textual narrative provided by the victim
- `voice_duration_sec` (integer, nullable) — duration of voice interaction if applicable
- `speech_metrics` (jsonb) — analyzed speech patterns (pitch, pauses, rate, etc.)
- `detected_indicators` (jsonb) — array of detected trauma/stress indicators
- `svi_score` (numeric) — Stress Vulnerability Index (0-100)
- `risk_category` (text) — Low / Moderate / High / Critical
- `recommendations` (jsonb) — array of recommended actions/services
- `counselling_recommended` (boolean) — whether counselling is flagged
- `emergency_flag` (boolean) — whether emergency intervention is flagged
- `consent_given` (boolean) — whether informed consent was given
- `created_at` (timestamptz) — assessment timestamp

### 3. consent_log
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users) — who gave consent
- `assessment_id` (uuid, nullable, references assessments) — linked assessment
- `consent_type` (text) — type of consent (assessment, voice_recording, data_storage)
- `consent_given` (boolean) — yes/no
- `language` (text) — language consent was presented in
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables
- profiles: users can read/update only their own profile
- assessments: users can read/insert only their own assessments
- consent_log: users can read/insert only their own consent records
- All policies scoped TO authenticated with auth.uid() ownership checks
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  location text NOT NULL,
  preferred_language text DEFAULT 'en',
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  narrative_text text NOT NULL DEFAULT '',
  voice_duration_sec integer,
  speech_metrics jsonb DEFAULT '{}'::jsonb,
  detected_indicators jsonb DEFAULT '[]'::jsonb,
  svi_score numeric NOT NULL DEFAULT 0,
  risk_category text NOT NULL DEFAULT 'Low',
  recommendations jsonb DEFAULT '[]'::jsonb,
  counselling_recommended boolean DEFAULT false,
  emergency_flag boolean DEFAULT false,
  consent_given boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
CREATE POLICY "select_own_assessments" ON assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
CREATE POLICY "insert_own_assessments" ON assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
CREATE POLICY "update_own_assessments" ON assessments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
CREATE POLICY "delete_own_assessments" ON assessments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Consent log table
CREATE TABLE IF NOT EXISTS consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL,
  consent_type text NOT NULL,
  consent_given boolean NOT NULL,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_consent" ON consent_log;
CREATE POLICY "select_own_consent" ON consent_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_consent" ON consent_log;
CREATE POLICY "insert_own_consent" ON consent_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_log_user_id ON consent_log(user_id);

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();