ALTER TABLE "organizations" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "primary_color" text DEFAULT '#0a0a0a' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "accent_color" text DEFAULT '#e8dcc8' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "default_lang" text DEFAULT 'ar' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "show_landing" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "x_handle" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "showcase_clients" jsonb DEFAULT '[]'::jsonb NOT NULL;