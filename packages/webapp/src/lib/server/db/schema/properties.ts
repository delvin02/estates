import { relations, sql, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import {
	mysqlTable,
	serial,
	text,
	int,
	varchar,
	float,
	timestamp,
	bigint,
	date
} from 'drizzle-orm/mysql-core';
import { version } from './version';
import { timestamps } from '../columns.helpers';

export const properties = mysqlTable('properties', {
	id: serial('id').primaryKey(),
	source: varchar('source', { length: 255 }),
	sourceURL: text('source_url'),
	sourceURLIdentifier: text('source_url_identifier'),
	sourcePropertyId: bigint('source_property_id', { mode: 'number', unsigned: true }),

	// address
	unit: varchar('unit', { length: 100 }),
	street: varchar('street', { length: 255 }).notNull(),
	city: varchar('city', { length: 100 }).notNull(),
	state: varchar('state', { length: 10 }).notNull(),
	postcode: varchar('postcode', { length: 20 }).notNull(),

	// property details
	bedrooms: int('bedrooms'),
	bathrooms: int('bathrooms'),
	parking: int('parking'),
	price: float('price'),
	type: varchar('type', { length: 50 }),
	soldDate: date('sold_date'),
	// TODO: squareFeet: int('square_feet')

	versionId: bigint('version_id', { mode: 'number', unsigned: true })
		.references(() => version.id, { onDelete: 'restrict' })
		.notNull(),

	...timestamps
});

export const propertiesRelations = relations(properties, ({ one, many }) => ({
	version: one(version, {
		fields: [properties.versionId],
		references: [version.id]
	})
}));

export type NewProperty = InferInsertModel<typeof properties>;
export type Property = InferSelectModel<typeof properties>;
