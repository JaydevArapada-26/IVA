-- Hand-authored migration, consistent with 0001/0002.

ALTER TABLE "users" ADD COLUMN "remember_me_enabled" boolean DEFAULT false NOT NULL;
