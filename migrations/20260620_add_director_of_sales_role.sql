INSERT INTO crm_role (name, hierarchy, status, type, department_id)
SELECT 'Director of Sales', 10, 1, 'director_of_sales', 1
WHERE NOT EXISTS (
  SELECT 1 FROM crm_role
  WHERE type = 'director_of_sales' OR LOWER(name) = 'director of sales'
);
