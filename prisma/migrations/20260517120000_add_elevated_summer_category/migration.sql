-- Create the Elevated Summer category so products and blog posts can be assigned to the new summer edit.
INSERT INTO "Category" ("id", "name")
SELECT 'category_elevated_summer_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Elevated Summer'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Elevated Summer');
