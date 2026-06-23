import { describe, expect, it } from 'vitest';
import type { ParsedTable } from './types';
import { cn, getSchemaAsMarkdown, tablesToSQL } from './utils';

describe('cn', () => {
  it('merges non-conflicting classes', () => {
    expect(cn('flex', 'text-sm')).toBe('flex text-sm');
  });

  it('lets later conflicting classes win', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
    expect(cn('flex', 'hidden')).toBe('hidden');
  });

  it('omits falsy values', () => {
    expect(cn('px-4', false && 'hidden', 'py-2')).toBe('px-4 py-2');
    expect(cn('flex', undefined, null, 'text-sm')).toBe('flex text-sm');
  });
});

describe('getSchemaAsMarkdown', () => {
  it('only includes tables for the requested schema', () => {
    const tables = [
      makeTable('public', 'users', [makeColumn({ name: 'id', format: 'INT', isPrimary: true })]),
      makeTable('auth', 'users', [makeColumn({ name: 'id', format: 'UUID', isPrimary: true })]),
    ];

    const markdown = getSchemaAsMarkdown('auth', tables);
    expect(markdown).toContain('## Table `users`');
    expect(markdown).toContain('UUID');
    expect(markdown).not.toContain('public');
  });

  it('escapes pipes, backticks, and newlines', () => {
    const tables = [
      makeTable('public', 'weird|table', [
        makeColumn({ name: 'col`1', format: 'TEXT\nwith newline' }),
      ]),
    ];

    const markdown = getSchemaAsMarkdown('public', tables);
    expect(markdown).toContain('weird\\|table');
    expect(markdown).toContain('col\\`1');
    expect(markdown).not.toContain('\nwith');
  });
});

describe('tablesToSQL', () => {
  it('renders columns with constraints', () => {
    const tables: ParsedTable[] = [
      {
        name: 'users',
        schema: 'public',
        comment: null,
        columns: [
          {
            name: 'id',
            dataType: 'SERIAL',
            isPrimaryKey: true,
            isNullable: false,
            isUnique: false,
            isIdentity: false,
            defaultValue: null,
            comment: null,
          },
          {
            name: 'email',
            dataType: 'VARCHAR(255)',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: true,
            isIdentity: false,
            defaultValue: null,
            comment: null,
          },
          {
            name: 'active',
            dataType: 'BOOLEAN',
            isPrimaryKey: false,
            isNullable: true,
            isUnique: false,
            isIdentity: false,
            defaultValue: 'false',
            comment: null,
          },
          {
            name: 'seq',
            dataType: 'INT',
            isPrimaryKey: false,
            isNullable: false,
            isUnique: false,
            isIdentity: true,
            defaultValue: null,
            comment: null,
          },
        ],
      },
    ];

    const sql = tablesToSQL(tables);
    expect(sql).toContain('CREATE TABLE public.users');
    expect(sql).toContain('id SERIAL PRIMARY KEY');
    expect(sql).toContain('email VARCHAR(255) NOT NULL UNIQUE');
    expect(sql).toContain('active BOOLEAN DEFAULT false');
    expect(sql).toContain('seq INT NOT NULL GENERATED ALWAYS AS IDENTITY');
  });
});

function makeColumn(
  overrides: Partial<{
    name: string;
    format: string;
    isPrimary: boolean;
    isNullable: boolean;
    isUnique: boolean;
    isIdentity: boolean;
  }> = {}
) {
  return {
    name: 'id',
    format: 'INT',
    isPrimary: false,
    isNullable: false,
    isUnique: false,
    isIdentity: false,
    ...overrides,
  };
}

function makeTable(schema: string, name: string, columns: ReturnType<typeof makeColumn>[]) {
  return {
    schema,
    name,
    comment: null,
    columns,
  };
}
