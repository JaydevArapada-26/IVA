-- Hand-authored migration, consistent with 0001 (drizzle-kit generate needs an interactive TTY
-- in this environment). Review before applying; run against a scratch/dev DATABASE_URL first.

CREATE TABLE "languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"native_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX "languages_code_unique" ON "languages" USING btree ("code");--> statement-breakpoint

-- Seed with the languages already hardcoded in the web/admin UI, so the CRUD table starts
-- reflecting what citizens already see instead of an empty list.
INSERT INTO "languages" ("code", "name", "native_name", "sort_order") VALUES
	('en', 'English', 'English', 0),
	('hi', 'Hindi', 'हिन्दी', 1),
	('ta', 'Tamil', 'தமிழ்', 2),
	('te', 'Telugu', 'తెలుగు', 3),
	('bn', 'Bengali', 'বাংলা', 4),
	('mr', 'Marathi', 'मराठी', 5),
	('gu', 'Gujarati', 'ગુજરાતી', 6);
