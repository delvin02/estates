import { db } from '$lib/server/db';
import { mapCSVRowToProperty, parseCSVFile } from '$lib/utils';
import { properties, version, type NewProperty } from '$lib/server/db/schema';
import { redisConnection } from '../redis.server';
import { Queue, Worker } from 'bullmq';

export const importPropertyCSVQueue = new Queue('import-property', {
	connection: redisConnection
});

const BATCH_SIZE = 1000;

new Worker(
	importPropertyCSVQueue.name,
	async (job) => {
		const { filename } = job.data;
		const rows = await parseCSVFile(`./static/uploads/${filename}`);
		if (!rows.length) throw new Error('Empty CSV or missing data.');

		await db.transaction(async (tx) => {
			const [{ id: versionId }] = await tx
				.insert(version)
				.values({ fileName: filename })
				.$returningId();

			const entries = rows
				.map((r) => mapCSVRowToProperty(r, versionId))
				.filter((p): p is NewProperty => p != null);

			for (let i = 0; i < entries.length; i += BATCH_SIZE) {
				await tx.insert(properties).values(entries.slice(i, i + BATCH_SIZE));
			}
		});
	},
	{
		connection: redisConnection
	}
)
	.on('completed', (job) => console.log(`Job ${job.id} completed`))
	.on('failed', (job, err) => console.error(`Job ${job?.id} failed: ${err.message}`))
	.on('progress', (job, p) => console.log(`Job ${job.id}: ${p}%`));
