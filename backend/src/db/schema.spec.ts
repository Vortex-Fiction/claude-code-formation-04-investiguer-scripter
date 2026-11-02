import { sql } from 'drizzle-orm';
import { getTableConfig, type SQLiteTable } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import { createDatabase, type Database } from './database';
import * as schema from './schema';

interface ColumnRow {
  name: string;
}

interface ForeignKeyRow {
  table: string;
  from: string;
  to: string;
}

const TABLES: SQLiteTable[] = [schema.authors, schema.books, schema.loans];

async function getSqlColumns(database: Database, tableName: string): Promise<string[]> {
  const rows = await database.all<ColumnRow>(sql.raw(`PRAGMA table_info(${tableName})`));
  return rows.map((row) => row.name).sort();
}

async function getSqlForeignKeys(database: Database, tableName: string): Promise<ForeignKeyRow[]> {
  const rows = await database.all<ForeignKeyRow>(sql.raw(`PRAGMA foreign_key_list(${tableName})`));
  return rows.map((row) => ({ table: row.table, from: row.from, to: row.to }));
}

function getSchemaForeignKeys(table: SQLiteTable): ForeignKeyRow[] {
  return getTableConfig(table).foreignKeys.map((foreignKey) => {
    const reference = foreignKey.reference();
    return {
      table: getTableConfig(reference.foreignTable).name,
      from: reference.columns[0].name,
      to: reference.foreignColumns[0].name,
    };
  });
}

describe('schema', () => {
  it.each(TABLES.map((table) => ({ tableName: getTableConfig(table).name, table })))(
    'declares the same columns and foreign keys as the SQL of the $tableName table',
    async ({ tableName, table }) => {
      const database = await createDatabase(':memory:');
      const schemaColumns = getTableConfig(table)
        .columns.map((column) => column.name)
        .sort();
      expect(await getSqlColumns(database, tableName)).toEqual(schemaColumns);
      expect(await getSqlForeignKeys(database, tableName)).toEqual(getSchemaForeignKeys(table));
    },
  );
});
