ALTER TABLE "plans" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "features" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "features_ar" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;