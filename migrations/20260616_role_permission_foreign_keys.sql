CREATE INDEX idx_dm_role_id ON crm_role(id);
CREATE INDEX idx_dm_permissions_id ON crm_permissions(id);

ALTER TABLE crm_role_permissions
  MODIFY COLUMN role_id INT NOT NULL;

ALTER TABLE crm_role_permissions
  ADD CONSTRAINT fk_dm_role_permissions_role
  FOREIGN KEY (role_id) REFERENCES crm_role(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE crm_role_permissions
  ADD CONSTRAINT fk_dm_role_permissions_permission
  FOREIGN KEY (permission_id) REFERENCES crm_permissions(id)
  ON DELETE CASCADE ON UPDATE CASCADE;
