import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'confirmed', 'failed']);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderUsername: text('sender_username').notNull(),
    senderAddress: text('sender_address').notNull(),
    recipientUsername: text('recipient_username').notNull(),
    recipientAddress: text('recipient_address').notNull(),
    amountMinor: text('amount_minor').notNull(),
    memo: text('memo'),
    idempotencyKey: text('idempotency_key'),
    unsignedXdr: text('unsigned_xdr'),
    unsignedTxDigest: text('unsigned_tx_digest'),
    txHash: text('tx_hash'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    isNewAccount: boolean('is_new_account').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    idempotencyIdx: uniqueIndex('payments_idempotency_key_idx').on(table.idempotencyKey),
  }),
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
