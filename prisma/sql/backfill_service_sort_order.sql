WITH ordered AS (
  SELECT id, "adminId",
         ROW_NUMBER() OVER (PARTITION BY "adminId" ORDER BY "active" DESC, name ASC) - 1 AS rn
  FROM "Service"
)
UPDATE "Service" s
SET "sortOrder" = o.rn
FROM ordered o
WHERE s.id = o.id;
