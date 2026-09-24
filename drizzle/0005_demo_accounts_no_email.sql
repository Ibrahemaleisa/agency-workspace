-- Sample accounts use made-up addresses: never email them until an admin sets a real address.
UPDATE "users" SET "email_notifications" = false
WHERE "email" IN (
  'sara@northwind.agency', 'karim@northwind.agency', 'omar@northwind.agency', 'maya@northwind.agency',
  'yusuf@northwind.agency', 'nour@northwind.agency', 'adam@northwind.agency', 'leila@northwind.agency',
  'lina@bloomcafe.com', 'daniel@atlasfitness.com', 'rana@verde-re.com'
);
