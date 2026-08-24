-- Hand-authored migration, consistent with 0001-0004.

CREATE TABLE IF NOT EXISTS "schemes_categorized" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid,
	"slug" text NOT NULL,
	"scheme_name" text NOT NULL,
	"level" text,
	"state" text,
	"district" text,
	"age_min_years" integer,
	"age_max_years" integer,
	"gender" text,
	"occupation_category" text,
	"annual_income_limit_inr" numeric(14, 2),
	"disability_status_required" boolean DEFAULT false NOT NULL,
	"doc_aadhaar" boolean,
	"doc_pan" boolean,
	"doc_income" boolean,
	"doc_caste" boolean,
	"doc_domicile" boolean,
	"doc_bank" boolean,
	"doc_ration" boolean,
	"doc_disability" boolean,
	"doc_educational" boolean,
	"doc_land" boolean,
	"beneficiary_type" text,
	"categories" text[],
	"benefit_type" text,
	"application_mode" text,
	"scheme_open_date" date,
	"scheme_close_date" date,
	"brief_description" text,
	"eligibility_raw" text,
	"documents_required_raw" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "schemes_categorized_slug_unique" ON "schemes_categorized" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schemes_categorized_scheme_id_idx" ON "schemes_categorized" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schemes_categorized_state_idx" ON "schemes_categorized" USING btree ("state");--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "schemes_categorized" ADD CONSTRAINT "schemes_categorized_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
