CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('owner', 'super_admin', 'reviewer', 'operator', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."admin_status" AS ENUM('active', 'disabled', 'locked');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn', 'disbursed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'duplicate', 'publish', 'retry', 'import', 'login', 'logout', 'assign', 'revoke');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('user', 'admin', 'worker', 'system');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('general', 'obc', 'sc', 'st', 'ews');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'archived', 'closed');--> statement-breakpoint
CREATE TYPE "public"."eligibility_comparison_operator" AS ENUM('eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'contains', 'exists');--> statement-breakpoint
CREATE TYPE "public"."eligibility_logic_operator" AS ENUM('and', 'or');--> statement-breakpoint
CREATE TYPE "public"."eligibility_result_status" AS ENUM('eligible', 'ineligible', 'partial', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."eligibility_source_kind" AS ENUM('profile_field', 'derived_value', 'document', 'scheme_metadata');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'transgender', 'other', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."import_item_status" AS ENUM('pending', 'validated', 'needs_review', 'approved', 'rejected', 'duplicate', 'extraction_failed', 'imported');--> statement-breakpoint
CREATE TYPE "public"."import_session_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."income_range" AS ENUM('lt_1_lakh', '1_to_25_lakh', '25_to_5_lakh', '5_to_8_lakh', 'gt_8_lakh');--> statement-breakpoint
CREATE TYPE "public"."job_attempt_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."language_code" AS ENUM('en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('system', 'user', 'assistant', 'tool');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'sms', 'email', 'push');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('scheme_alert', 'deadline_reminder', 'application_update', 'eligibility_update', 'sms_delivery', 'admin_broadcast', 'system');--> statement-breakpoint
CREATE TYPE "public"."occupation" AS ENUM('farmer', 'laborer', 'student', 'self_employed', 'unemployed', 'private_sector', 'government_sector', 'homemaker');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('incomplete', 'active', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."profile_version_source" AS ENUM('manual', 'import', 'system', 'admin_edit');--> statement-breakpoint
CREATE TYPE "public"."review_queue_status" AS ENUM('pending', 'needs_review', 'approved', 'rejected', 'duplicate', 'extraction_failed', 'updated');--> statement-breakpoint
CREATE TYPE "public"."review_source_type" AS ENUM('import_item', 'manual', 'api', 'system');--> statement-breakpoint
CREATE TYPE "public"."saved_scheme_source" AS ENUM('manual', 'recommendation', 'imported');--> statement-breakpoint
CREATE TYPE "public"."scheme_benefit_type" AS ENUM('financial', 'insurance', 'subsidy', 'service', 'loan', 'education', 'housing', 'healthcare', 'employment', 'other');--> statement-breakpoint
CREATE TYPE "public"."scheme_embedding_kind" AS ENUM('overview', 'benefits', 'eligibility', 'faq', 'source', 'full_text');--> statement-breakpoint
CREATE TYPE "public"."scheme_publication_status" AS ENUM('draft', 'in_review', 'published', 'archived', 'retired');--> statement-breakpoint
CREATE TYPE "public"."scheme_source_type" AS ENUM('official_portal', 'notification', 'gazette', 'pdf', 'web_page', 'manual', 'other');--> statement-breakpoint
CREATE TYPE "public"."scheme_source_verification_status" AS ENUM('unverified', 'pending', 'verified', 'needs_review', 'unreachable', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."sms_status" AS ENUM('queued', 'sending', 'sent', 'failed', 'dead_letter', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."worker_job_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."worker_job_queue" AS ENUM('ingestion', 'sms', 'assistant', 'admin', 'review', 'system');--> statement-breakpoint
CREATE TYPE "public"."worker_job_status" AS ENUM('queued', 'running', 'completed', 'failed', 'retrying', 'dead_letter');--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"details" text,
	"ip_address" "inet",
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "admin_role" DEFAULT 'reviewer' NOT NULL,
	"status" "admin_status" DEFAULT 'active' NOT NULL,
	"display_name" text,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid,
	"profile_version_id" uuid,
	"scheme_id" uuid,
	"status" "conversation_status" DEFAULT 'active' NOT NULL,
	"title" text,
	"summary" text,
	"model_name" text NOT NULL,
	"model_version" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"profile_version_id" uuid,
	"scheme_id" uuid NOT NULL,
	"application_status" "application_status" DEFAULT 'draft' NOT NULL,
	"external_reference" text,
	"application_url" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"withdrawn_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "audit_actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_admin_user_id" uuid,
	"actor_key" text,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"old_value" jsonb,
	"new_value" jsonb,
	"request_id" text,
	"ip_address" "inet",
	"user_agent" text,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_index" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"model_name" text,
	"model_version" text,
	"token_count" integer,
	"latency_ms" integer,
	"tool_name" text,
	"tool_call_id" text,
	"response_status" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "eligibility_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"profile_version_id" uuid,
	"scheme_id" uuid NOT NULL,
	"result_status" "eligibility_result_status" DEFAULT 'unknown' NOT NULL,
	"score" numeric(5, 2),
	"matched_rules_count" integer DEFAULT 0 NOT NULL,
	"failed_rules_count" integer DEFAULT 0 NOT NULL,
	"evaluator_version" text NOT NULL,
	"summary" text,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "government_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_department_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"code" text,
	"ministry_name" text,
	"website_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_session_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"source_row_hash" text NOT NULL,
	"status" "import_item_status" DEFAULT 'pending' NOT NULL,
	"source_row_data" jsonb NOT NULL,
	"extracted_title" text,
	"extracted_department_name" text,
	"extracted_category_name" text,
	"extracted_subcategory_name" text,
	"extracted_official_url" text,
	"extracted_summary" text,
	"extraction_confidence" numeric(5, 2),
	"validation_notes" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "import_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by_admin_user_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_hash" text NOT NULL,
	"mime_type" text,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"successful_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"status" "import_session_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "job_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" "job_attempt_status" NOT NULL,
	"worker_name" text NOT NULL,
	"worker_instance_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"log_output" text,
	"error_message" text,
	"error_stack" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid,
	"application_id" uuid,
	"scheme_id" uuid,
	"notification_type" "notification_type" DEFAULT 'system' NOT NULL,
	"channel" "notification_channel" DEFAULT 'in_app' NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profile_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source" "profile_version_source" DEFAULT 'manual' NOT NULL,
	"name" text,
	"phone_number" text,
	"age" integer,
	"gender" "gender",
	"state" text,
	"district" text,
	"income_range" "income_range",
	"occupation" "occupation",
	"category" "category",
	"disability_status" boolean DEFAULT false NOT NULL,
	"student_status" boolean DEFAULT false NOT NULL,
	"farmer_status" boolean DEFAULT false NOT NULL,
	"senior_citizen_status" boolean DEFAULT false NOT NULL,
	"language_code" "language_code" DEFAULT 'en' NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_status" "profile_status" DEFAULT 'incomplete' NOT NULL,
	"language_code" "language_code" DEFAULT 'en' NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"consent_updated_at" timestamp with time zone,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"current_version_number" integer DEFAULT 1 NOT NULL,
	"active_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_queue_id" uuid NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"comment_text" text NOT NULL,
	"is_internal" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" "review_source_type" DEFAULT 'import_item' NOT NULL,
	"import_item_id" uuid,
	"scheme_id" uuid,
	"status" "review_queue_status" DEFAULT 'pending' NOT NULL,
	"priority" "worker_job_priority" DEFAULT 'normal' NOT NULL,
	"confidence_score" numeric(5, 2),
	"extraction_error" text,
	"review_notes" text,
	"reviewed_by_admin_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"duplicate_of_scheme_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saved_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scheme_id" uuid NOT NULL,
	"source" "saved_scheme_source" DEFAULT 'manual' NOT NULL,
	"note" text,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"benefit_type" "scheme_benefit_type" DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"value_text" text,
	"value_min" numeric(18, 2),
	"value_max" numeric(18, 2),
	"unit_text" text,
	"frequency_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"document_code" text NOT NULL,
	"document_name" text NOT NULL,
	"description" text,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_eligibility_rule_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"group_order" integer DEFAULT 0 NOT NULL,
	"logic_operator" "eligibility_logic_operator" DEFAULT 'and' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_eligibility_rule_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"logic_mode" "eligibility_logic_operator" DEFAULT 'and' NOT NULL,
	"created_by_admin_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_eligibility_rule_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"value_order" integer DEFAULT 0 NOT NULL,
	"text_value" text,
	"numeric_value" numeric(18, 2),
	"boolean_value" boolean,
	"date_value" timestamp with time zone,
	"unit_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_eligibility_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_group_id" uuid NOT NULL,
	"rule_order" integer DEFAULT 0 NOT NULL,
	"source_kind" "eligibility_source_kind" NOT NULL,
	"field_key" text NOT NULL,
	"comparison_operator" "eligibility_comparison_operator" NOT NULL,
	"display_label" text NOT NULL,
	"negated" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"embedding_kind" "scheme_embedding_kind" DEFAULT 'full_text' NOT NULL,
	"model_name" text NOT NULL,
	"model_version" text NOT NULL,
	"dimension" integer DEFAULT 1536 NOT NULL,
	"chunk_index" smallint DEFAULT 0 NOT NULL,
	"content_text" text NOT NULL,
	"content_hash" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"source_type" "scheme_source_type" DEFAULT 'official_portal' NOT NULL,
	"source_url" text NOT NULL,
	"source_title" text,
	"source_identifier" text,
	"verification_status" "scheme_source_verification_status" DEFAULT 'unverified' NOT NULL,
	"verified_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"http_status" integer,
	"checksum" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_tag_maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scheme_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tag_type" text NOT NULL,
	"description" text,
	"is_system_generated" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"subcategory_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_title" text,
	"summary" text NOT NULL,
	"full_description" text NOT NULL,
	"official_url" text NOT NULL,
	"application_url" text,
	"publication_status" "scheme_publication_status" DEFAULT 'in_review' NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sms_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"notification_id" uuid,
	"phone_number" text NOT NULL,
	"message_body" text NOT NULL,
	"provider_name" text,
	"provider_message_id" text,
	"status" "sms_status" DEFAULT 'queued' NOT NULL,
	"priority" "worker_job_priority" DEFAULT 'normal' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"dead_lettered_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"display_name" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_sign_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worker_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_name" "worker_job_queue" DEFAULT 'system' NOT NULL,
	"job_type" text NOT NULL,
	"status" "worker_job_status" DEFAULT 'queued' NOT NULL,
	"priority" "worker_job_priority" DEFAULT 'normal' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 5 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"dead_lettered_at" timestamp with time zone,
	"lock_owner" text,
	"payload" jsonb NOT NULL,
	"result_payload" jsonb,
	"last_error" text,
	"last_error_stack" text,
	"dead_letter_reason" text,
	"import_session_id" uuid,
	"import_item_id" uuid,
	"review_queue_id" uuid,
	"scheme_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_profile_version_id_profile_versions_id_fk" FOREIGN KEY ("profile_version_id") REFERENCES "public"."profile_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_profile_version_id_profile_versions_id_fk" FOREIGN KEY ("profile_version_id") REFERENCES "public"."profile_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_admin_user_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_results" ADD CONSTRAINT "eligibility_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_results" ADD CONSTRAINT "eligibility_results_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_results" ADD CONSTRAINT "eligibility_results_profile_version_id_profile_versions_id_fk" FOREIGN KEY ("profile_version_id") REFERENCES "public"."profile_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_results" ADD CONSTRAINT "eligibility_results_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_departments" ADD CONSTRAINT "government_departments_parent_department_id_government_departments_id_fk" FOREIGN KEY ("parent_department_id") REFERENCES "public"."government_departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_uploaded_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("uploaded_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_attempts" ADD CONSTRAINT "job_attempts_job_id_worker_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."worker_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_queue_id_review_queue_id_fk" FOREIGN KEY ("review_queue_id") REFERENCES "public"."review_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_parent_comment_id_review_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."review_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_import_item_id_import_items_id_fk" FOREIGN KEY ("import_item_id") REFERENCES "public"."import_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_reviewed_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("reviewed_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_duplicate_of_scheme_id_schemes_id_fk" FOREIGN KEY ("duplicate_of_scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_schemes" ADD CONSTRAINT "saved_schemes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_schemes" ADD CONSTRAINT "saved_schemes_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_benefits" ADD CONSTRAINT "scheme_benefits_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_documents" ADD CONSTRAINT "scheme_documents_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_eligibility_rule_groups" ADD CONSTRAINT "scheme_eligibility_rule_groups_rule_set_id_scheme_eligibility_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."scheme_eligibility_rule_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_eligibility_rule_sets" ADD CONSTRAINT "scheme_eligibility_rule_sets_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_eligibility_rule_sets" ADD CONSTRAINT "scheme_eligibility_rule_sets_created_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_eligibility_rule_values" ADD CONSTRAINT "scheme_eligibility_rule_values_rule_id_scheme_eligibility_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."scheme_eligibility_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_eligibility_rules" ADD CONSTRAINT "scheme_eligibility_rules_rule_group_id_scheme_eligibility_rule_groups_id_fk" FOREIGN KEY ("rule_group_id") REFERENCES "public"."scheme_eligibility_rule_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_embeddings" ADD CONSTRAINT "scheme_embeddings_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_faqs" ADD CONSTRAINT "scheme_faqs_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_sources" ADD CONSTRAINT "scheme_sources_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_subcategories" ADD CONSTRAINT "scheme_subcategories_category_id_scheme_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."scheme_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_tag_maps" ADD CONSTRAINT "scheme_tag_maps_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_tag_maps" ADD CONSTRAINT "scheme_tag_maps_tag_id_scheme_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."scheme_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_department_id_government_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."government_departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_category_id_scheme_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."scheme_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_subcategory_id_scheme_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."scheme_subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_queue" ADD CONSTRAINT "sms_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_queue" ADD CONSTRAINT "sms_queue_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_jobs" ADD CONSTRAINT "worker_jobs_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_jobs" ADD CONSTRAINT "worker_jobs_import_item_id_import_items_id_fk" FOREIGN KEY ("import_item_id") REFERENCES "public"."import_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_jobs" ADD CONSTRAINT "worker_jobs_review_queue_id_review_queue_id_fk" FOREIGN KEY ("review_queue_id") REFERENCES "public"."review_queue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_jobs" ADD CONSTRAINT "worker_jobs_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_logs_admin_user_id_idx" ON "admin_logs" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "admin_logs_action_idx" ON "admin_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_logs_entity_type_idx" ON "admin_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "admin_logs_occurred_at_idx" ON "admin_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_user_id_unique" ON "admin_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_users_role_idx" ON "admin_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "admin_users_status_idx" ON "admin_users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_profile_id_idx" ON "ai_conversations" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_profile_version_id_idx" ON "ai_conversations" USING btree ("profile_version_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_scheme_id_idx" ON "ai_conversations" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_status_idx" ON "ai_conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_conversations_last_message_at_idx" ON "ai_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "applications_profile_id_idx" ON "applications" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "applications_profile_version_id_idx" ON "applications" USING btree ("profile_version_id");--> statement-breakpoint
CREATE INDEX "applications_scheme_id_idx" ON "applications" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "applications_application_status_idx" ON "applications" USING btree ("application_status");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_external_reference_unique" ON "applications" USING btree ("external_reference");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_type_idx" ON "audit_logs" USING btree ("actor_type");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_admin_user_id_idx" ON "audit_logs" USING btree ("actor_admin_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_messages_conversation_id_message_index_unique" ON "conversation_messages" USING btree ("conversation_id","message_index");--> statement-breakpoint
CREATE INDEX "conversation_messages_role_idx" ON "conversation_messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "eligibility_results_user_id_idx" ON "eligibility_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "eligibility_results_profile_id_idx" ON "eligibility_results" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "eligibility_results_profile_version_id_idx" ON "eligibility_results" USING btree ("profile_version_id");--> statement-breakpoint
CREATE INDEX "eligibility_results_scheme_id_idx" ON "eligibility_results" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "eligibility_results_result_status_idx" ON "eligibility_results" USING btree ("result_status");--> statement-breakpoint
CREATE UNIQUE INDEX "government_departments_slug_unique" ON "government_departments" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "government_departments_code_unique" ON "government_departments" USING btree ("code");--> statement-breakpoint
CREATE INDEX "government_departments_parent_department_id_idx" ON "government_departments" USING btree ("parent_department_id");--> statement-breakpoint
CREATE INDEX "import_items_import_session_id_idx" ON "import_items" USING btree ("import_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_items_import_session_id_row_number_unique" ON "import_items" USING btree ("import_session_id","row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "import_items_import_session_id_source_row_hash_unique" ON "import_items" USING btree ("import_session_id","source_row_hash");--> statement-breakpoint
CREATE INDEX "import_items_status_idx" ON "import_items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "import_sessions_file_hash_unique" ON "import_sessions" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "import_sessions_uploaded_by_admin_user_id_idx" ON "import_sessions" USING btree ("uploaded_by_admin_user_id");--> statement-breakpoint
CREATE INDEX "import_sessions_status_idx" ON "import_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_attempts_job_id_idx" ON "job_attempts" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_attempts_job_id_attempt_number_unique" ON "job_attempts" USING btree ("job_id","attempt_number");--> statement-breakpoint
CREATE INDEX "job_attempts_status_idx" ON "job_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_attempts_worker_name_idx" ON "job_attempts" USING btree ("worker_name");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_scheme_id_idx" ON "notifications" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "notifications_application_id_idx" ON "notifications" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_channel_idx" ON "notifications" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "notifications_notification_type_idx" ON "notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_versions_profile_id_version_number_unique" ON "profile_versions" USING btree ("profile_id","version_number");--> statement-breakpoint
CREATE INDEX "profile_versions_profile_id_idx" ON "profile_versions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profile_versions_source_idx" ON "profile_versions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "profile_versions_version_number_idx" ON "profile_versions" USING btree ("version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_unique" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profiles_profile_status_idx" ON "profiles" USING btree ("profile_status");--> statement-breakpoint
CREATE INDEX "profiles_language_code_idx" ON "profiles" USING btree ("language_code");--> statement-breakpoint
CREATE INDEX "review_comments_review_queue_id_idx" ON "review_comments" USING btree ("review_queue_id");--> statement-breakpoint
CREATE INDEX "review_comments_admin_user_id_idx" ON "review_comments" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "review_queue_source_type_idx" ON "review_queue" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "review_queue_status_idx" ON "review_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_queue_priority_idx" ON "review_queue" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "review_queue_import_item_id_unique" ON "review_queue" USING btree ("import_item_id");--> statement-breakpoint
CREATE INDEX "review_queue_scheme_id_idx" ON "review_queue" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "review_queue_reviewed_by_admin_user_id_idx" ON "review_queue" USING btree ("reviewed_by_admin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_schemes_user_id_scheme_id_unique" ON "saved_schemes" USING btree ("user_id","scheme_id");--> statement-breakpoint
CREATE INDEX "saved_schemes_user_id_idx" ON "saved_schemes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_schemes_scheme_id_idx" ON "saved_schemes" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_benefits_scheme_id_idx" ON "scheme_benefits" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_benefits_benefit_type_idx" ON "scheme_benefits" USING btree ("benefit_type");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_categories_slug_unique" ON "scheme_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_categories_name_unique" ON "scheme_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_documents_scheme_id_document_code_unique" ON "scheme_documents" USING btree ("scheme_id","document_code");--> statement-breakpoint
CREATE INDEX "scheme_documents_scheme_id_idx" ON "scheme_documents" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rule_groups_rule_set_id_idx" ON "scheme_eligibility_rule_groups" USING btree ("rule_set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_eligibility_rule_groups_rule_set_id_group_order_unique" ON "scheme_eligibility_rule_groups" USING btree ("rule_set_id","group_order");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_eligibility_rule_sets_scheme_id_version_number_unique" ON "scheme_eligibility_rule_sets" USING btree ("scheme_id","version_number");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rule_sets_scheme_id_idx" ON "scheme_eligibility_rule_sets" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rule_sets_is_active_idx" ON "scheme_eligibility_rule_sets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rule_values_rule_id_idx" ON "scheme_eligibility_rule_values" USING btree ("rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_eligibility_rule_values_rule_id_value_order_unique" ON "scheme_eligibility_rule_values" USING btree ("rule_id","value_order");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rules_rule_group_id_idx" ON "scheme_eligibility_rules" USING btree ("rule_group_id");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rules_source_kind_idx" ON "scheme_eligibility_rules" USING btree ("source_kind");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_eligibility_rules_rule_group_id_rule_order_unique" ON "scheme_eligibility_rules" USING btree ("rule_group_id","rule_order");--> statement-breakpoint
CREATE INDEX "scheme_embeddings_scheme_id_idx" ON "scheme_embeddings" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_embeddings_scheme_id_embedding_kind_idx" ON "scheme_embeddings" USING btree ("scheme_id","embedding_kind");--> statement-breakpoint
CREATE INDEX "scheme_embeddings_model_name_idx" ON "scheme_embeddings" USING btree ("model_name");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_embeddings_scheme_id_content_hash_unique" ON "scheme_embeddings" USING btree ("scheme_id","content_hash");--> statement-breakpoint
CREATE INDEX "scheme_faqs_scheme_id_idx" ON "scheme_faqs" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_sources_scheme_id_idx" ON "scheme_sources" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_sources_source_type_idx" ON "scheme_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "scheme_sources_verification_status_idx" ON "scheme_sources" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_sources_scheme_id_source_url_unique" ON "scheme_sources" USING btree ("scheme_id","source_url");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_subcategories_category_id_slug_unique" ON "scheme_subcategories" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "scheme_subcategories_category_id_idx" ON "scheme_subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_subcategories_category_id_sort_order_unique" ON "scheme_subcategories" USING btree ("category_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_tag_maps_scheme_id_tag_id_unique" ON "scheme_tag_maps" USING btree ("scheme_id","tag_id");--> statement-breakpoint
CREATE INDEX "scheme_tag_maps_scheme_id_idx" ON "scheme_tag_maps" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "scheme_tag_maps_tag_id_idx" ON "scheme_tag_maps" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_tags_slug_unique" ON "scheme_tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_tags_name_unique" ON "scheme_tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scheme_tags_tag_type_idx" ON "scheme_tags" USING btree ("tag_type");--> statement-breakpoint
CREATE UNIQUE INDEX "schemes_slug_unique" ON "schemes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "schemes_department_id_idx" ON "schemes" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "schemes_category_id_idx" ON "schemes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "schemes_subcategory_id_idx" ON "schemes" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "schemes_publication_status_idx" ON "schemes" USING btree ("publication_status");--> statement-breakpoint
CREATE INDEX "schemes_is_urgent_idx" ON "schemes" USING btree ("is_urgent");--> statement-breakpoint
CREATE INDEX "sms_queue_user_id_idx" ON "sms_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sms_queue_notification_id_idx" ON "sms_queue" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "sms_queue_status_idx" ON "sms_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sms_queue_priority_idx" ON "sms_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "sms_queue_provider_name_idx" ON "sms_queue" USING btree ("provider_name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_user_id_unique" ON "users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_number_unique" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worker_jobs_queue_name_idx" ON "worker_jobs" USING btree ("queue_name");--> statement-breakpoint
CREATE INDEX "worker_jobs_status_idx" ON "worker_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worker_jobs_priority_idx" ON "worker_jobs" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "worker_jobs_available_at_idx" ON "worker_jobs" USING btree ("available_at");--> statement-breakpoint
CREATE INDEX "worker_jobs_retry_count_idx" ON "worker_jobs" USING btree ("retry_count");--> statement-breakpoint
CREATE INDEX "worker_jobs_import_session_id_idx" ON "worker_jobs" USING btree ("import_session_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_import_item_id_idx" ON "worker_jobs" USING btree ("import_item_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_review_queue_id_idx" ON "worker_jobs" USING btree ("review_queue_id");--> statement-breakpoint
CREATE INDEX "worker_jobs_scheme_id_idx" ON "worker_jobs" USING btree ("scheme_id");