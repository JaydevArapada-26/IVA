import { index, integer, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { conversationStatusEnum, messageRoleEnum } from '../enums';
import { createdAtColumn, deletedAtColumn, updatedAtColumn, uuidPk } from '../helpers';
import { profileVersions, profiles, users } from './identity';
import { schemes } from './schemes';

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuidPk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    profileVersionId: uuid('profile_version_id').references(() => profileVersions.id, {
      onDelete: 'set null',
    }),
    schemeId: uuid('scheme_id').references(() => schemes.id, { onDelete: 'set null' }),
    status: conversationStatusEnum('status').notNull().default('active'),
    title: text('title'),
    summary: text('summary'),
    modelName: text('model_name').notNull(),
    modelVersion: text('model_version').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'date' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    userIdx: index('ai_conversations_user_id_idx').on(table.userId),
    profileIdx: index('ai_conversations_profile_id_idx').on(table.profileId),
    profileVersionIdx: index('ai_conversations_profile_version_id_idx').on(table.profileVersionId),
    schemeIdx: index('ai_conversations_scheme_id_idx').on(table.schemeId),
    statusIdx: index('ai_conversations_status_idx').on(table.status),
    lastMessageIdx: index('ai_conversations_last_message_at_idx').on(table.lastMessageAt),
  }),
);

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuidPk(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    messageIndex: integer('message_index').notNull(),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    modelName: text('model_name'),
    modelVersion: text('model_version'),
    tokenCount: integer('token_count'),
    latencyMs: integer('latency_ms'),
    toolName: text('tool_name'),
    toolCallId: text('tool_call_id'),
    responseStatus: text('response_status'),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: deletedAtColumn(),
  },
  (table) => ({
    conversationIdx: index('conversation_messages_conversation_id_idx').on(table.conversationId),
    messageOrderUnique: uniqueIndex('conversation_messages_conversation_id_message_index_unique').on(
      table.conversationId,
      table.messageIndex,
    ),
    roleIdx: index('conversation_messages_role_idx').on(table.role),
  }),
);
