ALTER TABLE checks ADD COLUMN avatar_url TEXT;

CREATE TABLE leaderboard (
  github_login TEXT PRIMARY KEY COLLATE NOCASE,
  avatar_url TEXT,
  larp_percent INTEGER NOT NULL,
  added_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX leaderboard_larp_percent ON leaderboard (larp_percent, added_at);
