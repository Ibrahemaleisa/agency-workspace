ALTER TABLE "plans" ADD COLUMN "max_members" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "max_clients" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "tier" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
-- The owner's plans (27 Sep 2026): Standard 299 and Full package 499, SAR per month. Edit in the control center → Plans.
INSERT INTO "plans" ("code", "name", "name_ar", "description", "description_ar", "features", "features_ar", "featured", "max_members", "max_clients", "tier", "price_cents", "currency", "interval", "trial_days", "sort", "active")
VALUES
  ('standard', 'Standard', 'الأساسية', 'For growing teams', 'للفرق النامية',
   '["Up to 10 team members","Up to 10 clients","Client portal and approvals","Projects, modules and tasks","Chat and notifications","Your brand, in Arabic and English"]'::jsonb,
   '["حتى ١٠ أعضاء في الفريق","حتى ١٠ عملاء","بوابة العملاء والموافقات","المشاريع والوحدات والمهام","المحادثات والإشعارات","هوية وكالتك بالعربية والإنجليزية"]'::jsonb,
   false, 10, 10, 'standard', 29900, 'SAR', 'month', 14, 1, true),
  ('full', 'Full package', 'الحزمة الكاملة', 'Everything, without limits', 'كل شيء، بلا حدود',
   '["Unlimited team members","Unlimited clients","Everything in Standard","Role dashboards and project health","Activity log and reports","Priority support"]'::jsonb,
   '["أعضاء فريق بلا حدود","عملاء بلا حدود","كل ما في الأساسية","لوحات الأدوار وصحة المشاريع","سجل النشاط والتقارير","دعم بأولوية"]'::jsonb,
   true, NULL, NULL, 'full', 49900, 'SAR', 'month', 14, 2, true)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
-- The launch plan is replaced by the two above; running trials on it get the full package.
UPDATE "plans" SET "active" = false WHERE "code" = 'workspace';
--> statement-breakpoint
UPDATE "subscriptions" SET "plan_code" = 'full', "updated_at" = now() WHERE "plan_code" = 'workspace' AND "provider_subscription_id" IS NULL;
