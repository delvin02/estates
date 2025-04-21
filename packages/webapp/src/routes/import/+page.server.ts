import { fail, json, type Actions } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import path from 'path';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { version } from '$lib/server/db/schema';
import { importPropertyCSVQueue } from '$lib/server/workers/import-property';
import { superValidate, fail as formFail } from 'sveltekit-superforms';
import { ImportPropertySchema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';
import type { ErrorResponse } from '$lib/common/@interfaces/api';

export const load = async () => {
	const form = await superValidate(zod(ImportPropertySchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(ImportPropertySchema));
		console.log(form.valid);
		console.log(form);
		if (!form.valid) {
			return formFail(400, { form });
		}

		const file = form.data.csv;

		const filename = file.name;

		const [existing] = await db.select().from(version).where(eq(version.fileName, filename));
		if (existing) {
			return fail(409, { message: 'This CSV has already been imported.' } as ErrorResponse);
		}

		const uploadDir = path.resolve('static', 'uploads');
		const filePath = path.join(uploadDir, filename);

		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(filePath, buffer);

		await importPropertyCSVQueue.add('batch-import', { filename });

		return json({ status: 200 });
	}
};
