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
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    predicted_impact_level VARCHAR(20) NOT NULL, -- Low, Medium, High, Critical
    impact_score NUMERIC(5, 4) NOT NULL,
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Resource Plans Table
CREATE TABLE IF NOT EXISTS public.resource_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
    police_required INTEGER NOT NULL DEFAULT 0,
    barricades_required INTEGER NOT NULL DEFAULT 0,
    diversion_strategy VARCHAR(20) NOT NULL DEFAULT 'No', -- No, Partial, Required, Mandatory
    synced BOOLEAN NOT NULL DEFAULT FALSE,
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
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Officers Table
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- available, dispatched
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Barricades Table
CREATE TABLE IF NOT EXISTS public.barricades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    depot_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 50,
    available_quantity INTEGER NOT NULL DEFAULT 50,
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Event Officers Mapping Table
CREATE TABLE IF NOT EXISTS public.event_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Event Barricades Mapping Table
CREATE TABLE IF NOT EXISTS public.event_barricades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    barricade_id UUID NOT NULL REFERENCES public.barricades(id) ON DELETE CASCADE,
    quantity_dispatched INTEGER NOT NULL DEFAULT 0,
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_events_junction ON public.events(junction);
CREATE INDEX IF NOT EXISTS idx_events_zone ON public.events(zone);
CREATE INDEX IF NOT EXISTS idx_predictions_level ON public.predictions(predicted_impact_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_hotspot_scores_score ON public.hotspot_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_officers_status ON public.officers(status);
CREATE INDEX IF NOT EXISTS idx_event_officers_event ON public.event_officers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_barricades_event ON public.event_barricades(event_id);
