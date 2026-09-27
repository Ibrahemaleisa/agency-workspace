-- Plan features in Arabic use Western digits, like the rest of the app.
UPDATE "plans" SET "features_ar" = '["حتى 10 أعضاء في الفريق","حتى 10 عملاء","بوابة العملاء والموافقات","المشاريع والوحدات والمهام","المحادثات والإشعارات","هوية وكالتك بالعربية والإنجليزية"]'::jsonb WHERE "code" = 'standard' AND "features_ar"::text LIKE '%١٠%';
