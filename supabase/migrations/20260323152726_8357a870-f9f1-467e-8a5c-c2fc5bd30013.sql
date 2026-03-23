-- Step 1: Nullify org_number on duplicate companies (keep the oldest per org_number)
WITH ranked AS (
  SELECT id, org_number,
    ROW_NUMBER() OVER (PARTITION BY org_number ORDER BY created_at ASC) AS rn
  FROM companies
  WHERE org_number IS NOT NULL
)
UPDATE companies
SET org_number = NULL
FROM ranked
WHERE companies.id = ranked.id
  AND ranked.rn > 1;

-- Step 2: Add UNIQUE constraint (NULLs are ignored by unique constraints in Postgres)
ALTER TABLE companies ADD CONSTRAINT companies_org_number_unique UNIQUE (org_number);