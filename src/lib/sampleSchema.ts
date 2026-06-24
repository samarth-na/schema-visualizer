import type { SqlDialect } from './types';

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
`;

export const SAMPLE_SCHEMA_MYSQL = `-- A tiny blog schema (MySQL flavor): backticks, AUTO_INCREMENT, UNSIGNED, column COMMENTs.
CREATE TABLE \`blog\`.\`authors\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`email\` VARCHAR(255) NOT NULL COMMENT 'login email',
  \`name\` VARCHAR(255) NOT NULL,
  \`bio\` TEXT,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_authors_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`blog\`.\`posts\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`author_id\` INT UNSIGNED NOT NULL,
  \`slug\` VARCHAR(255) NOT NULL,
  \`title\` VARCHAR(500) NOT NULL,
  \`body\` TEXT,
  \`published\` TINYINT(1) NOT NULL DEFAULT 0,
  \`published_at\` TIMESTAMP NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_posts_slug\` (\`slug\`),
  KEY \`idx_posts_author\` (\`author_id\`),
  CONSTRAINT \`fk_posts_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`blog\`.\`authors\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`blog\`.\`tags\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(100) NOT NULL,
  \`color\` VARCHAR(7) DEFAULT '#000000',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_tags_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`blog\`.\`post_tags\` (
  \`post_id\` INT UNSIGNED NOT NULL,
  \`tag_id\` INT UNSIGNED NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`post_id\`, \`tag_id\`),
  CONSTRAINT \`fk_post_tags_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`blog\`.\`posts\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_post_tags_tag\` FOREIGN KEY (\`tag_id\`) REFERENCES \`blog\`.\`tags\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`blog\`.\`comments\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`post_id\` INT UNSIGNED NOT NULL,
  \`author_name\` VARCHAR(255) NOT NULL,
  \`author_email\` VARCHAR(255) NOT NULL,
  \`body\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_comments_post\` (\`post_id\`),
  CONSTRAINT \`fk_comments_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`blog\`.\`posts\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export const SAMPLE_SCHEMA_SQLITE = `-- A tiny blog schema (SQLite flavor): INTEGER PRIMARY KEY AUTOINCREMENT, type affinity, inline REFERENCES.
CREATE TABLE authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bio TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#000000'
);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
`;

export const SAMPLE_SCHEMAS: Record<SqlDialect, string> = {
  postgresql: SAMPLE_SCHEMA,
  mysql: SAMPLE_SCHEMA_MYSQL,
  sqlite: SAMPLE_SCHEMA_SQLITE,
};
