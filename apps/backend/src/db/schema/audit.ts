import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { auditActionEnum, auditActorTypeEnum } from '../enums';
import { createdAtColumn, deletedAtColumn, inetColumn, updatedAtColumn, uuidPk } from '../helpers';
import { adminUsers, users } from './identity';

export const adminLogs = pgTable(
  'admin_logs',
  {
    id: uuidPk(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    action: auditActionEnum('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    details: text('details'),
    ipAddress: inetColumn('ip_address'),
    userAgent: text('user_agent'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    adminIdx: index('admin_logs_admin_user_id_idx').on(table.adminUserId),
    actionIdx: index('admin_logs_action_idx').on(table.action),
    entityIdx: index('admin_logs_entity_type_idx').on(table.entityType),
    occurredAtIdx: index('admin_logs_occurred_at_idx').on(table.occurredAt),
  }),
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuidPk(),
    actorType: auditActorTypeEnum('actor_type').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorAdminUserId: uuid('actor_admin_user_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    actorKey: text('actor_key'),
    action: auditActionEnum('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    requestId: text('request_id'),
    ipAddress: inetColumn('ip_address'),
    userAgent: text('user_agent'),
    reason: text('reason'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    actorTypeIdx: index('audit_logs_actor_type_idx').on(table.actorType),
    actorUserIdx: index('audit_logs_actor_user_id_idx').on(table.actorUserId),
    actorAdminIdx: index('audit_logs_actor_admin_user_id_idx').on(table.actorAdminUserId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    entityIdx: index('audit_logs_entity_type_idx').on(table.entityType),
    occurredAtIdx: index('audit_logs_occurred_at_idx').on(table.occurredAt),
  }),
);
