import { Parser } from 'node-sql-parser';

import type {
  ParsedColumn,
  ParsedRelationship,
  ParsedSchema,
  ParsedTable,
  SqlDialect,
} from './types';

type DialectConfig = {
  database: string;
  defaultSchema: string;
};

const DIALECT_CONFIGS: Record<SqlDialect, DialectConfig> = {
  postgresql: { database: 'PostgresQL', defaultSchema: 'public' },
  mysql: { database: 'MySQL', defaultSchema: 'default' },
  sqlite: { database: 'SQLite', defaultSchema: 'main' },
};

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

  let base = 'unknown';
  if (typeof def.dataType === 'string') {
    base = def.dataType.toUpperCase();
    if (def.length != null && typeof def.length === 'number') {
      if (def.scale != null && typeof def.scale === 'number') {
        base = `${base}(${def.length}, ${def.scale})`;
      } else {
        base = `${base}(${def.length})`;
      }
    } else if (Array.isArray(def.length) && def.length.length > 0) {
      base = `${base}(${def.length.join(', ')})`;
    } else if (typeof def.length === 'string') {
      base = `${base}(${def.length})`;
    }
  } else if (typeof def.expr?.value === 'string') {
    base = def.expr.value;
  }

  if (Array.isArray(def.suffix) && def.suffix.length > 0) {
    const suffix = def.suffix
      .map((s: unknown) => (typeof s === 'string' ? s.toUpperCase() : String(s)))
      .filter(Boolean)
      .join(' ');
    if (suffix) base = `${base} ${suffix}`;
  }

  return base;
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
  // MySQL wraps quoted strings: { type: 'single_quote_string', value: '...' }
  if (def.comment.value && typeof def.comment.value === 'object') {
    const inner = (def.comment.value as Record<string, any>).value;
    if (typeof inner === 'string') return inner;
  }
  return null;
}

function isIdentity(definition: unknown): boolean {
  if (!definition || typeof definition !== 'object') return false;
  const def = definition as Record<string, any>;

  // PG SERIAL/BIGSERIAL is conveyed by the dataType name.
  const dt = String(def.definition?.dataType ?? '').toLowerCase();
  if (dt.includes('serial') || dt.includes('identity')) return true;

  // MySQL emits auto_increment: "auto_increment"; SQLite emits
  // auto_increment: "autoincrement"; some shapes use a boolean true.
  const ai = def.auto_increment;
  if (ai == null || ai === false) return false;
  if (ai === true) return true;
  const aiStr = String(ai).toLowerCase();
  if (aiStr === 'false') return false;
  return aiStr === 'auto_increment' || aiStr === 'autoincrement' || aiStr === 'identity';
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

type ReferenceInfo = { schema: string; table: string; columns: string[] };

function getInlineReference(definition: unknown, defaultSchema: string): ReferenceInfo | null {
  if (!definition || typeof definition !== 'object') return null;
  const def = definition as Record<string, any>;
  const ref = def.reference_definition;
  if (!ref) return null;

  const tableArr = Array.isArray(ref.table) ? ref.table : ref.table ? [ref.table] : [];
  const tableInfo = tableArr[0];
  if (!tableInfo) return null;

  const schemaName =
    typeof tableInfo.db === 'string' ? normalizeIdentifier(tableInfo.db) : defaultSchema;
  const tableName = typeof tableInfo.table === 'string' ? normalizeIdentifier(tableInfo.table) : '';
  const columns = Array.isArray(ref.definition)
    ? ref.definition.map((col: unknown) => extractColumnName(col))
    : [];

  return { schema: schemaName, table: tableName, columns };
}

function getTableLevelReference(definition: unknown, defaultSchema: string): ReferenceInfo | null {
  if (!definition || typeof definition !== 'object') return null;
  const def = definition as Record<string, any>;
  const ref = def.reference_definition;
  if (!ref) return null;

  const tableArr = Array.isArray(ref.table) ? ref.table : ref.table ? [ref.table] : [];
  const tableInfo = tableArr[0];
  if (!tableInfo) return null;

  const schemaName =
    typeof tableInfo.db === 'string' ? normalizeIdentifier(tableInfo.db) : defaultSchema;
  const tableName = typeof tableInfo.table === 'string' ? normalizeIdentifier(tableInfo.table) : '';
  const columns = Array.isArray(ref.definition)
    ? ref.definition.map((col: unknown) => extractColumnName(col))
    : [];

  return { schema: schemaName, table: tableName, columns };
}

function normalizeIdentifier(name: unknown): string {
  if (typeof name !== 'string') return String(name ?? '');
  return name.replace(/^["`']+|["`']+$/g, '');
}

function getTableNameFromAst(
  tableArr: unknown,
  defaultSchema: string
): { schema: string; table: string } {
  const arr = Array.isArray(tableArr) ? tableArr : tableArr ? [tableArr] : [];
  const info = arr[0];
  if (!info || typeof info !== 'object') return { schema: defaultSchema, table: '' };
  const { db, table } = info as Record<string, any>;
  return {
    schema: typeof db === 'string' ? normalizeIdentifier(db) : defaultSchema,
    table: typeof table === 'string' ? normalizeIdentifier(table) : '',
  };
}

function extractConstraintColumns(definition: unknown[]): string[] {
  if (!Array.isArray(definition)) return [];
  return definition.map((col) => extractColumnName(col)).filter(Boolean);
}

function isTableLevelUniqueConstraint(constraintType: unknown): boolean {
  if (typeof constraintType !== 'string') return false;
  const ct = constraintType.toLowerCase();
  // PostgreSQL emits 'unique'; MySQL emits 'unique key'.
  return ct === 'unique' || ct === 'unique key';
}

function isTableLevelPrimaryConstraint(constraintType: unknown): boolean {
  return typeof constraintType === 'string' && constraintType.toLowerCase() === 'primary key';
}

function isTableLevelForeignConstraint(constraintType: unknown): boolean {
  return typeof constraintType === 'string' && constraintType.toLowerCase() === 'foreign key';
}

export function parseSql(sql: string, dialect: SqlDialect = 'postgresql'): ParsedSchema {
  const trimmed = sql.trim();
  if (!trimmed) return { tables: [], relationships: [] };

  const config = DIALECT_CONFIGS[dialect];
  const ast: any = parser.astify(trimmed, { database: config.database });

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
      const { schema, table } = getTableNameFromAst(stmt.table, config.defaultSchema);
      const createDefs = Array.isArray(stmt.create_definitions) ? stmt.create_definitions : [];

      const columns: ParsedColumn[] = [];
      const pkColumns = new Set<string>();
      const uniqueColumns = new Set<string>();

      // Pre-scan for table-level PK / UNIQUE constraints
      for (const def of createDefs) {
        if (!def || typeof def !== 'object') continue;
        if (def.resource === 'constraint' || def.constraint_type) {
          if (isTableLevelPrimaryConstraint(def.constraint_type)) {
            for (const col of extractConstraintColumns(def.definition)) {
              pkColumns.add(col);
            }
          } else if (isTableLevelUniqueConstraint(def.constraint_type)) {
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
        const inlineRef = getInlineReference(def, config.defaultSchema);
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
      const { schema, table } = getTableNameFromAst(stmt.table, config.defaultSchema);
      const createDefs = Array.isArray(stmt.create_definitions) ? stmt.create_definitions : [];

      for (const def of createDefs) {
        if (!def || typeof def !== 'object') continue;
        if (!(def.resource === 'constraint' || def.constraint_type)) continue;

        if (!isTableLevelForeignConstraint(def.constraint_type)) continue;

        const constraintName =
          typeof def.constraint === 'string'
            ? normalizeIdentifier(def.constraint)
            : `${table}_fkey`;
        const sourceCols = extractConstraintColumns(def.definition);
        const refInfo = getTableLevelReference(def, config.defaultSchema);

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
      const { schema, table } = getTableNameFromAst(stmt.table, config.defaultSchema);
      const exprs = Array.isArray(stmt.expr) ? stmt.expr : stmt.expr ? [stmt.expr] : [];

      for (const expr of exprs) {
        if (!expr || typeof expr !== 'object') continue;
        const action = String(expr.action).toLowerCase();
        if (action !== 'add') continue;

        const createDefs = expr.create_definitions ?? expr.definition;
        const constraints = Array.isArray(createDefs) ? createDefs : createDefs ? [createDefs] : [];

        for (const constraint of constraints) {
          if (!constraint || typeof constraint !== 'object') continue;
          if (!isTableLevelForeignConstraint(constraint.constraint_type)) continue;

          const constraintName =
            typeof constraint.constraint === 'string'
              ? normalizeIdentifier(constraint.constraint)
              : `${table}_fkey`;
          const sourceCols = extractConstraintColumns(constraint.definition);
          const refInfo = getTableLevelReference(constraint, config.defaultSchema);

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

export function getDefaultSchemaForDialect(dialect: SqlDialect): string {
  return DIALECT_CONFIGS[dialect].defaultSchema;
}
