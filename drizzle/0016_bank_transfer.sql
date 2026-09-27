CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "months" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "transferred_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "receipt_key" text;--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "receipt_name" text;--> statement-breakpoint
ALTER TABLE "plan_requests" ADD COLUMN "receipt_type" text;