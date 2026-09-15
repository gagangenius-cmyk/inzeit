-- Let notifications point at the page they're about, so the notification
-- bell can navigate there on click instead of just showing text.
ALTER TABLE crm_notifications
  ADD COLUMN related_id INT NULL AFTER message,
  ADD COLUMN related_type VARCHAR(50) NULL AFTER related_id,
  ADD COLUMN link VARCHAR(500) NULL AFTER related_type,
  ADD INDEX idx_notifications_related (related_type, related_id);
