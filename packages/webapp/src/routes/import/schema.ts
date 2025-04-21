import { z } from 'zod';

export const ImportPropertySchema = z.object({
	csv: z
		.instanceof(File, { message: 'Please upload a CSV file.' })
		.refine((f) => f.size > 0, { message: 'CSV must not be empty.' })
		.refine((file) => file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'), {
			message: 'Only CSV files are allowed.'
		})
});

export type ImportPropertyType = z.infer<typeof ImportPropertySchema>;
