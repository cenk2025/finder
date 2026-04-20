-- Migration: Lead enrichment columns
-- Run in Supabase SQL Editor after initial schema

alter table public.leads
  add column if not exists google_place_id text,
  add column if not exists google_rating numeric(3,2),
  add column if not exists google_reviews_count int,
  add column if not exists google_maps_url text,
  add column if not exists enriched_at timestamptz;

create index if not exists leads_enriched_idx on public.leads(user_id, enriched_at);
