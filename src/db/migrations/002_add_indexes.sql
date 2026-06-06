CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
ON reports(status, created_at);

CREATE INDEX IF NOT EXISTS idx_reports_user_id
ON reports(user_id);

CREATE INDEX IF NOT EXISTS idx_reports_category_id
ON reports(category_id);
