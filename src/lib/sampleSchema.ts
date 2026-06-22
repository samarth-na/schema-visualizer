export const SAMPLE_SCHEMA = `-- A tiny blog schema with FKs, PKs, unique constraints, and identities.
CREATE SCHEMA app;

CREATE TABLE app.authors (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.posts (
  id SERIAL PRIMARY KEY,
  author_id INT NOT NULL REFERENCES app.authors(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app.tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#000000'
);

CREATE TABLE app.post_tags (
  post_id INT NOT NULL REFERENCES app.posts(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES app.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE app.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES app.posts(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON app.comments(post_id);
`
