BEGIN;

-- Keep the oldest row for each case-insensitive Tailscale IP.
WITH ranked AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY lower(trim(tailscale_ip))
            ORDER BY id
        ) AS keep_id
    FROM servers
    WHERE tailscale_ip IS NOT NULL
      AND lower(trim(tailscale_ip)) <> ''
), duplicates AS (
    SELECT id, keep_id
    FROM ranked
    WHERE id <> keep_id
)
UPDATE metrics_history AS history
SET server_id = duplicates.keep_id
FROM duplicates
WHERE history.server_id = duplicates.id;

WITH ranked AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY lower(trim(tailscale_ip))
            ORDER BY id
        ) AS keep_id
    FROM servers
    WHERE tailscale_ip IS NOT NULL
      AND lower(trim(tailscale_ip)) <> ''
), duplicates AS (
    SELECT id, keep_id
    FROM ranked
    WHERE id <> keep_id
)
UPDATE alerts AS records
SET server_id = duplicates.keep_id
FROM duplicates
WHERE records.server_id = duplicates.id;

WITH ranked AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY lower(trim(tailscale_ip))
            ORDER BY id
        ) AS keep_id
    FROM servers
    WHERE tailscale_ip IS NOT NULL
      AND lower(trim(tailscale_ip)) <> ''
), duplicates AS (
    SELECT id, keep_id
    FROM ranked
    WHERE id <> keep_id
)
UPDATE predictions AS records
SET server_id = duplicates.keep_id
FROM duplicates
WHERE records.server_id = duplicates.id;

-- Exporter-shaped rows have no valid inventory identity; remove their history first.
DELETE FROM metrics_history
WHERE server_id IN (
     SELECT id FROM servers
     WHERE name ILIKE '%:9100%'
         OR (tailscale_ip IS NOT NULL AND tailscale_ip ILIKE '%:9100%')
);
DELETE FROM alerts
WHERE server_id IN (
     SELECT id FROM servers
     WHERE name ILIKE '%:9100%'
         OR (tailscale_ip IS NOT NULL AND tailscale_ip ILIKE '%:9100%')
);
DELETE FROM predictions
WHERE server_id IN (
     SELECT id FROM servers
     WHERE name ILIKE '%:9100%'
         OR (tailscale_ip IS NOT NULL AND tailscale_ip ILIKE '%:9100%')
);
DELETE FROM servers
WHERE name ILIKE '%:9100%'
    OR (tailscale_ip IS NOT NULL AND tailscale_ip ILIKE '%:9100%');

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY lower(trim(tailscale_ip))
            ORDER BY id
        ) AS row_number
    FROM servers
    WHERE tailscale_ip IS NOT NULL
      AND lower(trim(tailscale_ip)) <> ''
)
DELETE FROM servers
WHERE id IN (SELECT id FROM ranked WHERE row_number > 1);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_servers_tailscale_ip'
    ) THEN
        ALTER TABLE servers
            ADD CONSTRAINT uq_servers_tailscale_ip UNIQUE (tailscale_ip);
    END IF;
END $$;

COMMIT;