CREATE TABLE login (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE planning (
  uuid TEXT PRIMARY KEY,
  name TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted INTEGER DEFAULT 0
);

CREATE TABLE event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  planning_uuid TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  name TEXT,
  description TEXT,
  category INTEGER DEFAULT 1
);

CREATE TABLE presence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  instrument_code TEXT,
  presence INTEGER NOT NULL DEFAULT 0
);