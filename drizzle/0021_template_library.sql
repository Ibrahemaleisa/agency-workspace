ALTER TABLE "module_templates" ADD COLUMN "source_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "module_templates_org_source_idx" ON "module_templates" USING btree ("org_id","source_key");