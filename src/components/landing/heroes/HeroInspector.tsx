import { ArrowRight, GitBranch } from 'lucide-react';

import { HeroBadge } from '@/components/landing/HeroBadge';
import type { Relation } from '@/components/landing/InspectorTable';
import { InspectorTable, RelationChip } from '@/components/landing/InspectorTable';

const POSTS_COLUMNS = [
  { name: 'id', format: 'serial', isPrimary: true, isNullable: false, isIdentity: true },
  {
    name: 'author_id',
    format: 'int',
    isNullable: false,
  },
  { name: 'slug', format: 'varchar(255)', isUnique: true, isNullable: false },
  { name: 'title', format: 'varchar(500)', isNullable: false },
  { name: 'body', format: 'text', isNullable: true },
  {
    name: 'published',
    format: 'boolean',
    isNullable: true,
  },
  {
    name: 'published_at',
    format: 'timestamptz',
    isNullable: true,
  },
  {
    name: 'created_at',
    format: 'timestamptz',
    isNullable: true,
  },
];

const POSTS_RELATIONS: Relation[] = [
  {
    schema: 'app',
    table: 'authors',
    via: 'author_id',
    direction: 'out',
  },
  {
    schema: 'app',
    table: 'comments',
    via: 'post_id',
    direction: 'in',
  },
  {
    schema: 'app',
    table: 'post_tags',
    via: 'post_id',
    direction: 'in',
  },
];

export function HeroInspector() {
  return (
    <div className="mx-auto max-w-4xl">
      <HeroBadge index={4} total={5} concept="inspector · one table" className="mb-6" />

      <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.05]">
        Inspect one table. <span className="text-ink-2">See where it lives.</span>
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-sm text-ink-2 sm:text-base">
        Every column, every constraint, every relationship — at the level you read DDL, not a
        thumbnail.
      </p>

      <div className="mt-10">
        <InspectorTable
          schema="app"
          name="posts"
          description="A blog post. The hub of the sample schema."
          columns={POSTS_COLUMNS}
        />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-ink-3">
          <GitBranch size={12} strokeWidth={1.5} aria-hidden="true" />
          <span>this table relates to</span>
          <span className="text-ink-3/60">·</span>
          <span className="text-ink-2">3 foreign keys</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POSTS_RELATIONS.map((rel) => (
            <RelationChip
              key={`${rel.schema}.${rel.table}`}
              relation={rel}
              icon={
                rel.direction === 'out' ? (
                  <ArrowRight size={11} strokeWidth={1.5} />
                ) : (
                  <ArrowRight size={11} strokeWidth={1.5} className="rotate-180" />
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
