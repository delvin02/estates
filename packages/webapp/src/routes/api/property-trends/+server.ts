import PropertyDataUtility, { type AggregatedPeriodData } from '$lib/utility/PropertyDataUtility';
import path from 'path';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const postcode = url.searchParams.get('postcode');
	if (!postcode) {
		return new Response(JSON.stringify({ error: 'Missing postcode parameter' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const propertyUtility = new PropertyDataUtility();
	const sales = await propertyUtility.getProcessedData(postcode, 'bar', 'year');
	return json(sales);
};
