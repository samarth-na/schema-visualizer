export const POSTS_TABLE_SQL = `CREATE TABLE app.posts (
  id SERIAL PRIMARY KEY,
  author_id INT NOT NULL REFERENCES app.authors(id),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

export const AUTHORS_TABLE_SQL = `CREATE TABLE app.authors (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

export const POSTS_RELATIONS_SQL = `ALTER TABLE app.posts
  ADD CONSTRAINT fk_posts_author
  FOREIGN KEY (author_id)
  REFERENCES app.authors(id)
  ON DELETE CASCADE;`;
