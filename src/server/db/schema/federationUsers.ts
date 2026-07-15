import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const federationUsers = pgTable('federation_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  domain: text('domain').notNull().default('padala.ph'),
  stellarAddress: text('stellar_address').notNull(),
  displayName: text('display_name').notNull(),
  memo: text('memo'),
  memoType: text('memo_type'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FederationUser = typeof federationUsers.$inferSelect;
export type NewFederationUser = typeof federationUsers.$inferInsert;
