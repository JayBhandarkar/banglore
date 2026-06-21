-- Gridlock Traffic Remediation & Prediction Platform Database Schema
-- Run this script in the SQL Editor of your Supabase project (https://supabase.com)

-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    event_cause VARCHAR(100) NOT NULL,
    requires_road_closure BOOLEAN NOT NULL DEFAULT FALSE,
    veh_type VARCHAR(50) NOT NULL,
    corridor VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    junction VARCHAR(150) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    start_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_datetime TIMESTAMP WITH TIME ZONE,
    duration_minutes NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    predicted_impact_level VARCHAR(20) NOT NULL, -- Low, Medium, High, Critical
    impact_score NUMERIC(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Resource Plans Table
CREATE TABLE IF NOT EXISTS public.resource_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
    police_required INTEGER NOT NULL DEFAULT 0,
    barricades_required INTEGER NOT NULL DEFAULT 0,
    diversion_strategy VARCHAR(20) NOT NULL DEFAULT 'No', -- No, Partial, Required, Mandatory
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Hotspot Scores Table
CREATE TABLE IF NOT EXISTS public.hotspot_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    junction_name VARCHAR(150) UNIQUE NOT NULL,
    score NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    event_count INTEGER NOT NULL DEFAULT 1,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_events_junction ON public.events(junction);
CREATE INDEX IF NOT EXISTS idx_events_zone ON public.events(zone);
CREATE INDEX IF NOT EXISTS idx_predictions_level ON public.predictions(predicted_impact_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_hotspot_scores_score ON public.hotspot_scores(score DESC);
