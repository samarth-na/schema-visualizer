import { Parser } from 'node-sql-parser';

import type { ParsedColumn, ParsedRelationship, ParsedSchema, ParsedTable } from './types';

const parser = new Parser();

function extractColumnName(columnRef: unknown): string {
  if (typeof columnRef === 'string') return normalizeIdentifier(columnRef);
  if (!columnRef || typeof columnRef !== 'object') return '';
  const ref = columnRef as Record<string, any>;

  // node-sql-parser v5 wraps column names like this:
  // { type: 'column_ref', table: null, column: { expr: { type: 'default', value: 'id' } } }
  const exprValue = ref.column?.expr?.value;
  if (typeof exprValue === 'string') return normalizeIdentifier(exprValue);

  const col = ref.column;
  if (typeof col === 'string') return normalizeIdentifier(col);

  return '';
}

function parseDataType(definition: unknown): string {
  if (!definition || typeof definition !== 'object') return 'unknown';
  const def = definition as Record<string, any>;

  if (typeof def.dataType === 'string') {
    const base = def.dataType.toUpperCase();
    if (def.length != null && typeof def.length === 'number') {
      if (def.scale != null && typeof def.scale === 'number') {
        return `${base}(${def.length}, ${def.scale})`;
      }
      return `${base}(${def.length})`;
    }
    if (Array.isArray(def.length) && def.length.length > 0) {
      return `${base}(${def.length.join(', ')})`;
    }
    if (typeof def.length === 'string') {
      return `${base}(${def.length})`;
    }
    return base;
  }

  if (typeof def.expr?.value === 'string') {
    return def.expr.value;
  }

  return 'unknown';
}

function isNotNull(definition: unknown): boolean {
  // Without explicit definition metadata, assume the column is nullable.
  if (!definition || typeof definition !== 'object') return false;
  const def = definition as Record<string, any>;
  const nullable = def.nullable;
  if (!nullable) return false;
  if (typeof nullable === 'object') {
    const val = String(nullable.value ?? nullable.type ?? '').toLowerCase();
    return val === 'not null' || val === 'notnull';
  }
  return String(nullable).toLowerCase() === 'not null';
}

function extractDefaultValue(definition: unknown): string | null {
  if (!definition || typeof definition !== 'object') return null;
  const def = definition as Record<string, any>;
  let defaultVal = def.default_val ?? def.default;
  if (!defaultVal) return null;

  // node-sql-parser sometimes wraps literals one level deeper:
  // { type: 'default', value: { type: 'bool', value: false } }
  if (
    typeof defaultVal === 'object' &&
    defaultVal.value !== undefined &&
    typeof defaultVal.value !== 'string' &&
    typeof defaultVal.value !== 'number' &&
    typeof defaultVal.value !== 'boolean'
  ) {
    defaultVal = defaultVal.value;
  }

  if (typeof defaultVal === 'string') return defaultVal;
  if (typeof defaultVal.value === 'string') return defaultVal.value;
  if (typeof defaultVal.value === 'number') return String(defaultVal.value);
  if (typeof defaultVal.value === 'boolean') return String(defaultVal.value);
  if (defaultVal.expr) {
    return String(defaultVal.expr.value ?? JSON.stringify(defaultVal.expr));
  }
  if (typeof defaultVal === 'object') {
    return String(defaultVal.value ?? JSON.stringify(defaultVal));
  }
  return null;
}

function extractComment(definition: unknown): string | null {
  if (!definition || typeof definition !== 'object') return null;
  const def = definition as Record<string, any>;
  if (!def.comment) return null;
  if (typeof def.comment === 'string') return def.comment;
  if (typeof def.comment.value === 'string') return def.comment.value;
  return null;
}

function isIdentity(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return false;
  const def = definition as Record<string, any>;
  if (def.auto_increment === true || String(def.auto_increment).toLowerCase() === 'true')
    return true;
  if (def.identity === true || String(def.identity).toLowerCase() === 'true') return true;
  const dt = String(def.definition?.dataType).toLowerCase();
  return dt.includes('serial') || dt.includes('identity');
}

function isPrimaryKey(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return false;
  const def = definition as Record<string, any>;
  if (typeof def.primary_key === 'string') {
    return def.primary_key.toLowerCase().includes('primary');
  }
  return false;
}

function isUniqueColumn(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return false;
  const def = definition as Record<string, any>;
  if (typeof def.unique === 'string') {
    return def.unique.toLowerCase() === 'unique';
  }
  return false;
}

function getInlineReference(
  definition: unknown
): { schema: string; table: string; columns: string[] } | null {
  if (!definition || typeof definition !== 'object') return null;
  const def = definition as Record<string, any>;
  const ref = def.reference_definition;
  if (!ref) return null;

  const tableArr = Array.isArray(ref.table) ? ref.table : ref.table ? [ref.table] : [];
  const tableInfo = tableArr[0];
  if (!tableInfo) return null;

  const schemaName =
    typeof tableInfo.db === 'string' ? normalizeIdentifier(tableInfo.db) : 'public';
  const tableName = typeof tableInfo.table === 'string' ? normalizeIdentifier(tableInfo.table) : '';
  const columns = Array.isArray(ref.definition)
    ? ref.definition.map((col: unknown) => extractColumnName(col))
    : [];

  return { schema: schemaName, table: tableName, columns };
}

function getTableLevelReference(
  definition: unknown
): { schema: string; table: string; columns: string[] } | null {
  if (!definition || typeof definition !== 'object') return null;
  const def = definition as Record<string, any>;
  const ref = def.reference_definition;
  if (!ref) return null;

  const tableArr = Array.isArray(ref.table) ? ref.table : ref.table ? [ref.table] : [];
  const tableInfo = tableArr[0];
  if (!tableInfo) return null;

  const schemaName =
    typeof tableInfo.db === 'string' ? normalizeIdentifier(tableInfo.db) : 'public';
  const tableName = typeof tableInfo.table === 'string' ? normalizeIdentifier(tableInfo.table) : '';
  const columns = Array.isArray(ref.definition)
    ? ref.definition.map((col: unknown) => extractColumnName(col))
    : [];

  return { schema: schemaName, table: tableName, columns };
}

function normalizeIdentifier(name: unknown): string {
  if (typeof name !== 'string') return String(name ?? '');
  return name.replace(/^["'`]+|["'`]+$/g, '');
}

function getTableNameFromAst(tableArr: unknown): { schema: string; table: string } {
  const arr = Array.isArray(tableArr) ? tableArr : tableArr ? [tableArr] : [];
  const info = arr[0];
  if (!info || typeof info !== 'object') return { schema: 'public', table: '' };
  const { db, table } = info as Record<string, any>;
  return {
    schema: typeof db === 'string' ? normalizeIdentifier(db) : 'public',
    table: typeof table === 'string' ? normalizeIdentifier(table) : '',
  };
}

function extractConstraintColumns(definition: unknown[]): string[] {
  if (!Array.isArray(definition)) return [];
  return definition.map((col) => extractColumnName(col)).filter(Boolean);
}

export function parseSql(sql: string): ParsedSchema {
  const trimmed = sql.trim();
  if (!trimmed) return { tables: [], relationships: [] };

  let ast: any;
  try {
    ast = parser.astify(trimmed, { database: 'PostgresQL' });
  } catch (_err) {
    ast = parser.astify(trimmed);
  }

  const statements = Array.isArray(ast) ? ast : ast ? [ast] : [];

  const tables: ParsedTable[] = [];
  const tableMap = new Map<string, ParsedTable>();
  const relationships: ParsedRelationship[] = [];
  let relIdCounter = 0;

  const tableKey = (schema: string, table: string) => `${schema}.${table}`;
  const nextRelId = () => {
    relIdCounter += 1;
    return relIdCounter;
  };

  // First pass: CREATE TABLE
  for (const stmt of statements) {
    if (!stmt || typeof stmt !== 'object') continue;

    if (stmt.type === 'create' && String(stmt.keyword).toLowerCase() === 'table') {
      const { schema, table } = getTableNameFromAst(stmt.table);
      const createDefs = Array.isArray(stmt.create_definitions) ? stmt.create_definitions : [];

      const columns: ParsedColumn[] = [];
      const pkColumns = new Set<string>();
      const uniqueColumns = new Set<string>();

      // Pre-scan for table-level PK / UNIQUE constraints
      for (const def of createDefs) {
        if (!def || typeof def !== 'object') continue;
        if (def.resource === 'constraint' || def.constraint_type) {
          const ct = String(def.constraint_type).toLowerCase();
          if (ct === 'primary key') {
            for (const col of extractConstraintColumns(def.definition)) {
              pkColumns.add(col);
            }
          } else if (ct === 'unique') {
            for (const col of extractConstraintColumns(def.definition)) {
              uniqueColumns.add(col);
            }
          }
        }
      }

      for (const def of createDefs) {
        if (!def || typeof def !== 'object') continue;
        if (def.resource === 'constraint' || def.constraint_type) {
          // Table-level FK constraints handled in a later pass
          continue;
        }

        const colName = extractColumnName(def.column);
        if (!colName) continue;

        const dataType = parseDataType(def.definition);
        const nullable = !isNotNull(def);
        const primary = pkColumns.has(colName) || isPrimaryKey(def);
        const unique = uniqueColumns.has(colName) || isUniqueColumn(def);
        const identity = isIdentity(def);

        if (primary) pkColumns.add(colName);
        if (unique) uniqueColumns.add(colName);

        columns.push({
          name: colName,
          dataType,
          isPrimaryKey: primary,
          isNullable: nullable,
          isUnique: unique,
          isIdentity: identity,
          defaultValue: extractDefaultValue(def),
          comment: extractComment(def),
        });

        // Inline FK reference
        const inlineRef = getInlineReference(def);
        if (inlineRef && inlineRef.table && inlineRef.columns.length > 0) {
          relationships.push({
            id: `${schema}.${table}.${colName}->${inlineRef.schema}.${inlineRef.table}.${inlineRef.columns[0]}_${nextRelId()}`,
            constraintName: `${table}_${colName}_fkey`,
            sourceSchema: schema,
            sourceTable: table,
            sourceColumn: colName,
            targetSchema: inlineRef.schema,
            targetTable: inlineRef.table,
            targetColumn: inlineRef.columns[0],
          });
        }
      }

      const parsedTable: ParsedTable = {
        name: table,
        schema,
        comment: null,
        columns,
      };
      tables.push(parsedTable);
      tableMap.set(tableKey(schema, table), parsedTable);
    }
  }

  // Second pass: table-level constraints and ALTER TABLE ADD FOREIGN KEY
  for (const stmt of statements) {
    if (!stmt || typeof stmt !== 'object') continue;

    if (stmt.type === 'create' && String(stmt.keyword).toLowerCase() === 'table') {
      const { schema, table } = getTableNameFromAst(stmt.table);
      const createDefs = Array.isArray(stmt.create_definitions) ? stmt.create_definitions : [];

      for (const def of createDefs) {
        if (!def || typeof def !== 'object') continue;
        if (!(def.resource === 'constraint' || def.constraint_type)) continue;

        const ct = String(def.constraint_type).toLowerCase();
        if (ct !== 'foreign key') continue;

        const constraintName =
          typeof def.constraint === 'string'
            ? normalizeIdentifier(def.constraint)
            : `${table}_fkey`;
        const sourceCols = extractConstraintColumns(def.definition);
        const refInfo = getTableLevelReference(def);

        if (!refInfo || !refInfo.table || sourceCols.length === 0 || refInfo.columns.length === 0)
          continue;

        for (let i = 0; i < sourceCols.length; i++) {
          const sourceCol = sourceCols[i];
          const targetCol = refInfo.columns[i];
          if (!sourceCol || !targetCol) continue;

          relationships.push({
            id: `${constraintName}_${sourceCol}_${i}_${nextRelId()}`,
            constraintName,
            sourceSchema: schema,
            sourceTable: table,
            sourceColumn: sourceCol,
            targetSchema: refInfo.schema,
            targetTable: refInfo.table,
            targetColumn: targetCol,
          });
        }
      }
    }

    if (stmt.type === 'alter') {
      const { schema, table } = getTableNameFromAst(stmt.table);
      const exprs = Array.isArray(stmt.expr) ? stmt.expr : stmt.expr ? [stmt.expr] : [];

      for (const expr of exprs) {
        if (!expr || typeof expr !== 'object') continue;
        const action = String(expr.action).toLowerCase();
        if (action !== 'add') continue;

        const createDefs = expr.create_definitions ?? expr.definition;
        const constraints = Array.isArray(createDefs) ? createDefs : createDefs ? [createDefs] : [];

        for (const constraint of constraints) {
          if (!constraint || typeof constraint !== 'object') continue;
          const ct = String(constraint.constraint_type).toLowerCase();
          if (ct !== 'foreign key') continue;

          const constraintName =
            typeof constraint.constraint === 'string'
              ? normalizeIdentifier(constraint.constraint)
              : `${table}_fkey`;
          const sourceCols = extractConstraintColumns(constraint.definition);
          const refInfo = getTableLevelReference(constraint);

          if (!refInfo || !refInfo.table || sourceCols.length === 0 || refInfo.columns.length === 0)
            continue;

          for (let i = 0; i < sourceCols.length; i++) {
            const sourceCol = sourceCols[i];
            const targetCol = refInfo.columns[i];
            if (!sourceCol || !targetCol) continue;

            relationships.push({
              id: `${constraintName}_${sourceCol}_${i}_alter_${nextRelId()}`,
              constraintName,
              sourceSchema: schema,
              sourceTable: table,
              sourceColumn: sourceCol,
              targetSchema: refInfo.schema,
              targetTable: refInfo.table,
              targetColumn: targetCol,
            });
          }
        }
      }
    }
  }

  return { tables, relationships };
}

export function formatParseError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Failed to parse SQL. Please check your syntax.';
}
