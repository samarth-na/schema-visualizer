import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ParsedTable } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function copyToClipboard(text: string, onSuccess?: () => void) {
  try {
    await navigator.clipboard.writeText(text)
    onSuccess?.()
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

function escapeForMarkdown(str: string) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/([|`])/g, '\\$1')
    .replace(/\n/g, ' ')
}

function getTableDefinitionAsMarkdown(table: {
  name: string
  comment: string | null
  columns: {
    name: string
    format: string
    isPrimary: boolean
    isNullable: boolean
    isUnique: boolean
    isIdentity: boolean
  }[]
}) {
  let markdown = `## Table \`${escapeForMarkdown(table.name)}\`\n\n`
  if (table.comment) {
    markdown += `${table.comment}\n\n`
  }
  markdown += `### Columns\n\n`
  markdown += `| Name | Type | Constraints |\n`
  markdown += `|------|------|-------------|\n`

  return table.columns.reduce((current, column) => {
    const constraints = [
      column.isPrimary ? 'Primary' : '',
      column.isNullable ? 'Nullable' : '',
      column.isUnique ? 'Unique' : '',
      column.isIdentity ? 'Identity' : '',
    ]
      .filter(Boolean)
      .join(' ')
    current += `| \`${escapeForMarkdown(column.name)}\` | \`${escapeForMarkdown(column.format)}\` | ${constraints} |\n`
    return current
  }, markdown)
}

export function getSchemaAsMarkdown(
  schema: string,
  tables: {
    schema: string
    name: string
    comment: string | null
    columns: {
      name: string
      format: string
      isPrimary: boolean
      isNullable: boolean
      isUnique: boolean
      isIdentity: boolean
    }[]
  }[]
) {
  return tables
    .filter((t) => t.schema === schema)
    .reduce((current, table) => {
      current += `${getTableDefinitionAsMarkdown(table)}\n`
      return current
    }, '')
}

export function tablesToSQL(tables: ParsedTable[]) {
  return tables
    .map((table) => {
      const cols = table.columns
        .map((col) => {
          const parts = [
            `  ${col.name} ${col.dataType}`,
            col.isPrimaryKey ? 'PRIMARY KEY' : '',
            col.isNullable ? '' : 'NOT NULL',
            col.isUnique ? 'UNIQUE' : '',
            col.isIdentity ? 'GENERATED ALWAYS AS IDENTITY' : '',
            col.defaultValue ? `DEFAULT ${col.defaultValue}` : '',
          ]
            .filter(Boolean)
            .join(' ')
          return parts
        })
        .join(',\n')
      return `CREATE TABLE ${table.schema}.${table.name} (\n${cols}\n);`
    })
    .join('\n\n')
}

