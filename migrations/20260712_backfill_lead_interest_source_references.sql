-- Store lead interest/source fields as relational ids instead of display text.
-- Run after the reference tables (crm_country_proces, crm_service, crm_source)
-- are populated.

UPDATE crm_forum_leads l
JOIN crm_country_proces cp
  ON LOWER(TRIM(l.country_interest)) = LOWER(TRIM(cp.name))
SET l.country_interest = cp.id
WHERE l.country_interest IS NOT NULL
  AND TRIM(l.country_interest) <> ''
  AND l.country_interest REGEXP '[^0-9]';

UPDATE crm_forum_leads l
JOIN (
  SELECT 'uk' AS alias_name, 'United Kingdom' AS country_name
  UNION ALL SELECT 'u.k.', 'United Kingdom'
  UNION ALL SELECT 'u.k', 'United Kingdom'
  UNION ALL SELECT 'gb', 'United Kingdom'
  UNION ALL SELECT 'great britain', 'United Kingdom'
  UNION ALL SELECT 'united states', 'USA'
  UNION ALL SELECT 'united states of america', 'USA'
  UNION ALL SELECT 'us', 'USA'
  UNION ALL SELECT 'u.s.', 'USA'
  UNION ALL SELECT 'u.s', 'USA'
) country_aliases
  ON LOWER(TRIM(l.country_interest)) = country_aliases.alias_name
JOIN crm_country_proces cp
  ON LOWER(TRIM(cp.name)) = LOWER(country_aliases.country_name)
SET l.country_interest = cp.id
WHERE l.country_interest IS NOT NULL
  AND TRIM(l.country_interest) <> ''
  AND l.country_interest REGEXP '[^0-9]';

UPDATE crm_forum_leads l
JOIN crm_service s
  ON LOWER(TRIM(l.service_interest)) = LOWER(TRIM(s.name))
SET l.service_interest = s.id
WHERE l.service_interest IS NOT NULL
  AND TRIM(l.service_interest) <> ''
  AND l.service_interest REGEXP '[^0-9]';

UPDATE crm_forum_leads l
JOIN crm_source ms
  ON LOWER(TRIM(l.market_source)) = LOWER(TRIM(ms.name))
SET l.market_source = ms.id
WHERE l.market_source IS NOT NULL
  AND TRIM(l.market_source) <> ''
  AND l.market_source REGEXP '[^0-9]';

UPDATE crm_forum_leads
SET country_interest = NULL
WHERE country_interest IS NOT NULL
  AND TRIM(country_interest) <> ''
  AND country_interest REGEXP '[^0-9]';

UPDATE crm_forum_leads
SET service_interest = NULL
WHERE service_interest IS NOT NULL
  AND TRIM(service_interest) <> ''
  AND service_interest REGEXP '[^0-9]';

UPDATE crm_forum_leads
SET market_source = NULL
WHERE market_source IS NOT NULL
  AND TRIM(market_source) <> ''
  AND market_source REGEXP '[^0-9]';

UPDATE crm_forum_leads l
LEFT JOIN crm_country_proces cp ON cp.id = CAST(l.country_interest AS UNSIGNED)
SET l.country_interest = NULL
WHERE l.country_interest IS NOT NULL
  AND TRIM(l.country_interest) <> ''
  AND l.country_interest REGEXP '^[0-9]+$'
  AND cp.id IS NULL;

UPDATE crm_forum_leads l
LEFT JOIN crm_service s ON s.id = CAST(l.service_interest AS UNSIGNED)
SET l.service_interest = NULL
WHERE l.service_interest IS NOT NULL
  AND TRIM(l.service_interest) <> ''
  AND l.service_interest REGEXP '^[0-9]+$'
  AND s.id IS NULL;

UPDATE crm_forum_leads l
LEFT JOIN crm_source ms ON ms.id = CAST(l.market_source AS UNSIGNED)
SET l.market_source = NULL
WHERE l.market_source IS NOT NULL
  AND TRIM(l.market_source) <> ''
  AND l.market_source REGEXP '^[0-9]+$'
  AND ms.id IS NULL;

UPDATE crm_forum_leads
SET country_interest = NULL
WHERE country_interest IS NOT NULL AND TRIM(country_interest) = '';

UPDATE crm_forum_leads
SET service_interest = NULL
WHERE service_interest IS NOT NULL AND TRIM(service_interest) = '';

UPDATE crm_forum_leads
SET market_source = NULL
WHERE market_source IS NOT NULL AND TRIM(market_source) = '';

ALTER TABLE crm_forum_leads
  MODIFY country_interest INT NULL,
  MODIFY service_interest INT NULL,
  MODIFY market_source INT NULL,
  ADD INDEX idx_dmc_forum_leads_country_interest (country_interest),
  ADD INDEX idx_dmc_forum_leads_service_interest (service_interest),
  ADD INDEX idx_dmc_forum_leads_market_source (market_source),
  ADD CONSTRAINT fk_dmc_forum_leads_country_interest
    FOREIGN KEY (country_interest) REFERENCES crm_country_proces (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_dmc_forum_leads_service_interest
    FOREIGN KEY (service_interest) REFERENCES crm_service (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_dmc_forum_leads_market_source
    FOREIGN KEY (market_source) REFERENCES crm_source (id)
    ON UPDATE CASCADE ON DELETE SET NULL;
