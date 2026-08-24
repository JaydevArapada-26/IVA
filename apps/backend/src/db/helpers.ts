import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  inet,
  numeric,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export function uuidPk(name = 'id') {
  return uuid(name).defaultRandom().primaryKey();
}

export function createdAtColumn(name = 'created_at') {
  return timestamp(name, { withTimezone: true, mode: 'date' }).defaultNow().notNull();
}

export function updatedAtColumn(name = 'updated_at') {
  return timestamp(name, { withTimezone: true, mode: 'date' }).defaultNow().notNull();
}

export function deletedAtColumn(name = 'deleted_at') {
  return timestamp(name, { withTimezone: true, mode: 'date' });
}

export function activeBooleanColumn(name = 'is_active') {
  return boolean(name).notNull().default(true);
}

export function sortOrderColumn(name = 'sort_order') {
  return integer(name).notNull().default(0);
}

export function revisionColumn(name = 'version_number') {
  return integer(name).notNull().default(1);
}

export function confidenceColumn(name = 'confidence_score') {
  return numeric(name, { precision: 5, scale: 2 }).notNull().default('0');
}

export function inetColumn(name = 'ip_address') {
  return inet(name);
}

export function notEmptyTextColumn(name: string) {
  return text(name).notNull();
}

export const setUpdatedAtTriggerSql = sql`
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;
`;
