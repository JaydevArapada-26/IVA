-- Hand-authored migration (consistent with 0002-0005 — this repo's migrations/ folder and
-- meta/_journal.json are not kept in sync with `drizzle-kit migrate`; schema changes are applied
-- directly against DATABASE_URL, same as prior migrations in this folder). Idempotent throughout
-- (IF NOT EXISTS / ADD VALUE IF NOT EXISTS / guarded CREATE TYPE) so it is safe to re-run.
--
-- Stage 1 (signup profile expansion): new profile_versions eligibility fields + extended `category`
-- (caste) enum + profiles.daily_scheme_sms_enabled preference.
-- Stage 3 (daily scheme SMS automation): sms_notifications automation columns + partial unique
-- index (the actual "one automated SMS per user per day" guarantee) + daily_sms_job_runs table.

-- ---------------------------------------------------------------------------
-- New enum types (Stage 1)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "residence_type" AS ENUM ('rural', 'urban');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "marital_status" AS ENUM ('single', 'married', 'widowed', 'divorced_separated', 'prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "education_level" AS ENUM (
    'not_studying', 'school_1_5', 'school_6_8', 'school_9_10', 'school_11_12', 'diploma_iti',
    'undergraduate', 'postgraduate', 'phd_research', 'professional_course', 'vocational_skill'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "employment_status" AS ENUM (
    'student', 'employed', 'self_employed', 'business_owner', 'farmer', 'agricultural_worker',
    'labour_worker', 'unemployed', 'retired', 'homemaker', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "bpl_ews_status" AS ENUM ('bpl', 'ews', 'neither', 'not_sure', 'prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "disability_percentage" AS ENUM ('below_40', '40_59', '60_79', '80_plus', 'not_sure');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "land_ownership" AS ENUM ('yes', 'no', 'lease_rented', 'not_sure');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "landholding_size" AS ENUM ('lt_1_acre', 'acre_1_2', 'acre_2_5', 'acre_5_10', 'gt_10_acre');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "agriculture_activity_type" AS ENUM (
    'crops', 'horticulture', 'dairy', 'livestock', 'fisheries', 'mixed_farming', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "education_stream" AS ENUM (
    'science', 'commerce', 'arts_humanities', 'engineering', 'medicine', 'law', 'management',
    'agriculture', 'it_computer_science', 'vocational_technical', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "housing_situation" AS ENUM (
    'own_home', 'renting', 'no_permanent_home', 'temporary_kutcha', 'other', 'prefer_not_to_say'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "business_type" AS ENUM (
    'retail', 'manufacturing', 'services', 'agriculture_related', 'handicraft_artisan',
    'food_business', 'technology', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Extend the existing caste enum (additive only — enum values are never removed/reordered).
ALTER TYPE "category" ADD VALUE IF NOT EXISTS 'prefer_not_to_say';
ALTER TYPE "category" ADD VALUE IF NOT EXISTS 'other';

-- ---------------------------------------------------------------------------
-- profiles / profile_versions columns (Stage 1 + Stage 3 preference)
-- ---------------------------------------------------------------------------
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "daily_scheme_sms_enabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "profile_versions"
  ADD COLUMN IF NOT EXISTS "residence_type" "residence_type",
  ADD COLUMN IF NOT EXISTS "marital_status" "marital_status",
  ADD COLUMN IF NOT EXISTS "education_level" "education_level",
  ADD COLUMN IF NOT EXISTS "employment_status" "employment_status",
  ADD COLUMN IF NOT EXISTS "bpl_ews_status" "bpl_ews_status",
  ADD COLUMN IF NOT EXISTS "disability_percentage" "disability_percentage",
  ADD COLUMN IF NOT EXISTS "has_dependents" boolean,
  ADD COLUMN IF NOT EXISTS "number_of_dependents" integer,
  ADD COLUMN IF NOT EXISTS "special_circumstances" text[],
  ADD COLUMN IF NOT EXISTS "owns_agricultural_land" "land_ownership",
  ADD COLUMN IF NOT EXISTS "landholding_size" "landholding_size",
  ADD COLUMN IF NOT EXISTS "agriculture_activity_type" "agriculture_activity_type",
  ADD COLUMN IF NOT EXISTS "education_stream" "education_stream",
  ADD COLUMN IF NOT EXISTS "current_year_class" text,
  ADD COLUMN IF NOT EXISTS "housing_situation" "housing_situation",
  ADD COLUMN IF NOT EXISTS "owns_residential_land" boolean,
  ADD COLUMN IF NOT EXISTS "business_type" "business_type";

-- ---------------------------------------------------------------------------
-- Daily scheme SMS automation (Stage 3)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "sms_automation_type" AS ENUM ('manual', 'daily_scheme_sms');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "daily_sms_job_trigger_source" AS ENUM ('scheduler', 'admin_manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "daily_sms_job_run_status" AS ENUM ('running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TYPE "sms_notification_status" ADD VALUE IF NOT EXISTS 'skipped';

ALTER TABLE "sms_notifications"
  ADD COLUMN IF NOT EXISTS "automation_type" "sms_automation_type" NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "delivery_date" date,
  ADD COLUMN IF NOT EXISTS "locale" "language_code",
  ADD COLUMN IF NOT EXISTS "skip_reason" text;

CREATE INDEX IF NOT EXISTS "sms_notifications_automation_type_idx" ON "sms_notifications" ("automation_type");

-- The actual "one automated SMS per user per day" guarantee — DB-backed, survives restarts,
-- concurrent workers, and manual re-triggers. Only applies to automated rows; manual admin sends
-- (delivery_date left null, automation_type='manual') never touch this index.
CREATE UNIQUE INDEX IF NOT EXISTS "sms_notifications_daily_user_date_unique"
  ON "sms_notifications" ("user_id", "delivery_date")
  WHERE "automation_type" = 'daily_scheme_sms';

CREATE TABLE IF NOT EXISTS "daily_sms_job_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trigger_source" "daily_sms_job_trigger_source" NOT NULL,
  "triggered_by_admin_user_id" uuid,
  "delivery_date" date NOT NULL,
  "status" "daily_sms_job_run_status" NOT NULL DEFAULT 'running',
  "users_considered" integer NOT NULL DEFAULT 0,
  "users_skipped" integer NOT NULL DEFAULT 0,
  "messages_enqueued" integer NOT NULL DEFAULT 0,
  "no_suitable_scheme_count" integer NOT NULL DEFAULT 0,
  "error_summary" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "daily_sms_job_runs"
    ADD CONSTRAINT "daily_sms_job_runs_triggered_by_admin_user_id_admin_users_id_fk"
    FOREIGN KEY ("triggered_by_admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "daily_sms_job_runs_status_idx" ON "daily_sms_job_runs" ("status");
CREATE INDEX IF NOT EXISTS "daily_sms_job_runs_delivery_date_idx" ON "daily_sms_job_runs" ("delivery_date");
