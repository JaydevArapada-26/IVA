-- Hand-authored migration, consistent with 0001-0003.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint

ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_aadhaar" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_pan" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_income" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_caste" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_domicile" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_bank" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_ration" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_disability" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_educational" boolean;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD COLUMN IF NOT EXISTS "doc_land" boolean;
