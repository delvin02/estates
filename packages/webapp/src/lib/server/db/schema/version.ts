import { relations, sql, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { mysqlTable, serial, varchar, timestamp } from 'drizzle-orm/mysql-core';
import { properties } from './properties';
import { timestamps } from '../columns.helpers';

export const version = mysqlTable('version', {
	id: serial('id').primaryKey(),
	uploadTimestamp: timestamp('upload_timestamp').notNull().defaultNow(),
	fileName: varchar('file_name', { length: 255 }),
	...timestamps
});

export const versionRelations = relations(version, ({ many }) => ({
	properties: many(properties)
}));

export type NewVersion = InferInsertModel<typeof version>;
export type Version = InferSelectModel<typeof version>;
