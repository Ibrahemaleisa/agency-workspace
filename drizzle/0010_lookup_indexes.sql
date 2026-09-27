CREATE INDEX "project_members_user_idx" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");