-- Lark Budget Export - D1データベーススキーマ
-- エクスポートログを保存

CREATE TABLE IF NOT EXISTS export_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  term TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_export_logs_year_term ON export_logs(year, term);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at);
