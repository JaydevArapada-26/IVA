import { boolean, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdAtColumn, updatedAtColumn, uuidPk } from '../helpers';

/** Backs the admin Language Management CRUD table used to add/remove UI languages. */
export const languages = pgTable(
  'languages',
  {
    id: uuidPk(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    nativeName: text('native_name').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    codeUnique: uniqueIndex('languages_code_unique').on(table.code),
  }),
);
