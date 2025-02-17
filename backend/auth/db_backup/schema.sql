DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    token TEXT NOT NULL,
    registration_date TIMESTAMP,
    last_login TIMESTAMP,
    avatar_url TEXT DEFAULT NULL,
    is_validated INTEGER DEFAULT 0
);