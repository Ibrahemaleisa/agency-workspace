ALTER TYPE "public"."subscription_status" ADD VALUE 'expired';--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verifications_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "emailed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_id" uuid;--> statement-breakpoint
-- Every existing person becomes an account (emails were unique across the platform), keeping their password.
INSERT INTO "accounts" ("email", "password_hash", "created_at")
  SELECT DISTINCT ON (lower("email")) lower("email"), "password_hash", "created_at" FROM "users" ORDER BY lower("email"), "created_at";--> statement-breakpoint
UPDATE "users" u SET "account_id" = a."id", "email" = a."email" FROM "accounts" a WHERE a."email" = lower(u."email");--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verifications_account_idx" ON "email_verifications" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_org_account_idx" ON "users" USING btree ("org_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_org_email_idx" ON "users" USING btree ("org_id","email");--> statement-breakpoint
CREATE INDEX "users_account_idx" ON "users" USING btree ("account_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";