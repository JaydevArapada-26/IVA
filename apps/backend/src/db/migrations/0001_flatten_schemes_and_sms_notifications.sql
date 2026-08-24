-- Hand-authored migration (drizzle-kit generate requires an interactive TTY to resolve the
-- rename-vs-drop ambiguity on renamed columns, which isn't available in this environment).
-- Review before applying; run against a scratch/dev DATABASE_URL first, take a backup before
-- applying to any database holding real user data.

-- 1. New enums for the IVA SMS notification pipeline
CREATE TYPE "public"."sms_notification_type" AS ENUM('scheme_recommendation', 'eligibility_alert', 'new_scheme_alert', 'deadline_reminder', 'admin_manual');--> statement-breakpoint
CREATE TYPE "public"."sms_notification_status" AS ENUM('queued', 'sending', 'sent', 'delivered', 'failed', 'retrying');--> statement-breakpoint

-- 2. Flatten `schemes` to the CSV-import shape
ALTER TABLE "schemes" ALTER COLUMN "department_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schemes" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schemes" RENAME COLUMN "title" TO "scheme_name";--> statement-breakpoint
ALTER TABLE "schemes" RENAME COLUMN "summary" TO "brief_description";--> statement-breakpoint
ALTER TABLE "schemes" RENAME COLUMN "full_description" TO "detailed_description";--> statement-breakpoint
ALTER TABLE "schemes" RENAME COLUMN "official_url" TO "source_url";--> statement-breakpoint

ALTER TABLE "schemes" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "ministry" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "beneficiary_type" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "target_beneficiaries" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "benefit_type" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "categories" text[];--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "sub_categories" text[];--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "benefits" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "eligibility" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "exclusions" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "application_mode" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "application_process" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "documents_required" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "references" text;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "scheme_open_date" date;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "scheme_close_date" date;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "dbt_scheme" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "schemes" ADD COLUMN "faq_count" integer;--> statement-breakpoint

CREATE INDEX "schemes_state_idx" ON "schemes" USING btree ("state");--> statement-breakpoint

-- 3. New sms_notifications table (IVA notification pipeline, separate from sms_queue/OTP)
CREATE TABLE "sms_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scheme_id" uuid,
	"notification_type" "sms_notification_type" NOT NULL,
	"eligibility_result_status" "eligibility_result_status",
	"match_score" numeric(5, 2),
	"match_reasons" text[],
	"message_body" text NOT NULL,
	"status" "sms_notification_status" DEFAULT 'queued' NOT NULL,
	"twilio_message_sid" text,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"triggered_by_admin_user_id" uuid,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "sms_notifications" ADD CONSTRAINT "sms_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_notifications" ADD CONSTRAINT "sms_notifications_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_notifications" ADD CONSTRAINT "sms_notifications_triggered_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("triggered_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "sms_notifications_user_id_idx" ON "sms_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sms_notifications_scheme_id_idx" ON "sms_notifications" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "sms_notifications_status_idx" ON "sms_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sms_notifications_notification_type_idx" ON "sms_notifications" USING btree ("notification_type");
