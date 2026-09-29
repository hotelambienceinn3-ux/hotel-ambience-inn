# Supabase Backend Configuration

This directory contains Supabase platform configurations, migrations, and edge functions for Hotel Ambience Inn.

## Structure

- `migrations/`: Database SQL migration files tracking schema changes.
- `functions/`: Supabase Edge Functions for serverless backend tasks.

## Application Architecture

Hotel Ambience Inn relies on Supabase for data storage, authentication, row-level security (RLS), and database trigger functions. The frontend application interacts directly with Supabase via `@supabase/supabase-js` using the client in `frontend/src/lib/supabaseClient.js` and services in `frontend/src/services/`.
