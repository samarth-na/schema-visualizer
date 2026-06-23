export type ParsedColumn = {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isIdentity: boolean;
  defaultValue: string | null;
  comment: string | null;
};

export type ParsedRelationship = {
  id: string;
  constraintName: string;
  sourceSchema: string;
  sourceTable: string;
  sourceColumn: string;
  targetSchema: string;
  targetTable: string;
  targetColumn: string;
};

export type ParsedTable = {
  name: string;
  schema: string;
  comment: string | null;
  columns: ParsedColumn[];
};

export type ParsedSchema = {
  tables: ParsedTable[];
  relationships: ParsedRelationship[];
};

export type TableNodeData = {
  id: string;
  schema: string;
  name: string;
  comment: string | null;
  isForeign: boolean;
  columns: {
    id: string;
    name: string;
    format: string;
    isPrimary: boolean;
    isNullable: boolean;
    isUnique: boolean;
    isIdentity: boolean;
    description: string;
  }[];
};

export type EdgeData = {
  sourceName: string;
  sourceSchemaName: string;
  sourceColumnName: string;
  targetName: string;
  targetSchemaName: string;
  targetColumnName: string;
};
