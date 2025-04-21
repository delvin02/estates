import { sql } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/mysql-core';

export const timestamps = {
	updatedAt: timestamp('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.onUpdateNow(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at').default(sql`null`)
};
