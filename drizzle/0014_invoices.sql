CREATE SEQUENCE "public"."invoice_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text DEFAULT 'INV-' || lpad(nextval('invoice_number_seq')::text, 6, '0') NOT NULL,
	"org_id" uuid NOT NULL,
	"plan_code" text,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"provider" text NOT NULL,
	"provider_invoice_id" text NOT NULL,
	"url" text,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_number_unique" UNIQUE("number"),
	CONSTRAINT "invoices_provider_invoice_id_unique" UNIQUE("provider_invoice_id")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_org_idx" ON "invoices" USING btree ("org_id","created_at");