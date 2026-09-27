CREATE TABLE "platform_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"visitor_id" text,
	"account_id" uuid,
	"org_id" uuid,
	"signup_id" uuid,
	"path" text,
	"country" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "login_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "signups" ADD COLUMN "visitor_id" text;--> statement-breakpoint
ALTER TABLE "signups" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_events" ADD CONSTRAINT "platform_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_events" ADD CONSTRAINT "platform_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_events" ADD CONSTRAINT "platform_events_signup_id_signups_id_fk" FOREIGN KEY ("signup_id") REFERENCES "public"."signups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_events_type_idx" ON "platform_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "platform_events_visitor_idx" ON "platform_events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "platform_events_account_idx" ON "platform_events" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "signups_created_idx" ON "signups" USING btree ("created_at");