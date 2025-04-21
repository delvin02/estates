import { eq } from 'drizzle-orm';
import { parse, format } from 'date-fns';
import { db } from '$lib/server/db';
import { properties, type Property } from '$lib/server/db/schema';

interface CleanedPropertyData {
	Postcode: string;
	SoldDate: Date;
	Price: number;
	Period?: string;
}

export interface AggregatedPeriodData {
	Period: string;
	Value: number;
}

interface BoxPlotData {
	[period: string]: number[];
}

export type graphType = 'box' | 'line' | 'bar' | 'scatter';

export default class PropertyDataUtility {
	private async getAllByPostcode(targetPostcode: string): Promise<Property[]> {
		return await db.select().from(properties).where(eq(properties.postcode, targetPostcode));
	}

	private cleanAndFilterData(rows: Property[]): CleanedPropertyData[] {
		return rows
			.filter((row) => row.soldDate !== null && row.price !== null)
			.map((row) => ({
				Postcode: row.postcode,
				SoldDate: row.soldDate as Date,
				Price: row.price as number
			}))
			.sort((a, b) => a.SoldDate.getTime() - b.SoldDate.getTime());
	}

	private aggregateData(
		data: CleanedPropertyData[],
		graphType: graphType,
		timePeriod: string
	): any {
		if (data.length === 0) {
			return graphType === 'box' ? {} : [];
		}

		let periodAccessor: (date: Date) => string;
		switch (timePeriod) {
			case 'month':
				periodAccessor = (date) => format(date, 'yyyy-MM');
				break;
			case 'quarter':
				periodAccessor = (date) => format(date, 'yyyy-QQQ');
				break;
			case 'year':
				periodAccessor = (date) => format(date, 'yyyy');
				break;
			default:
				throw new Error(
					`Invalid time_period: ${timePeriod}. Supported: 'month', 'quarter', 'year'.`
				);
		}

		const withPeriod = data.map((d) => ({ ...d, Period: periodAccessor(d.SoldDate) }));
		const grouped = withPeriod.reduce(
			(acc, curr) => {
				acc[curr.Period!] = acc[curr.Period!] || [];
				acc[curr.Period!].push(curr);
				return acc;
			},
			{} as Record<string, CleanedPropertyData[]>
		);

		const periods = Object.keys(grouped).sort();

		if (graphType === 'line') {
			return periods.map((period) => {
				const sales = grouped[period];
				const avg = sales.reduce((sum, s) => sum + s.Price, 0) / sales.length;
				return { Period: period, Value: avg };
			});
		}

		if (graphType === 'bar') {
			return periods.map((period) => ({ Period: period, Value: grouped[period].length }));
		}

		if (graphType === 'box') {
			return periods.reduce((acc: BoxPlotData, p) => {
				acc[p] = grouped[p].map((s) => s.Price);
				return acc;
			}, {});
		}

		// scatter
		return data.map((d) => ({ SoldDate: d.SoldDate, Price: d.Price }));
	}

	public async getProcessedData(
		targetPostcode: string,
		graphType: graphType,
		timePeriod: string
	): Promise<any> {
		const rows = await this.getAllByPostcode(targetPostcode);
		if (rows.length === 0) {
			return { message: `No data found for postcode ${targetPostcode}` };
		}

		const cleaned = this.cleanAndFilterData(rows);
		try {
			return this.aggregateData(cleaned, graphType, timePeriod);
		} catch (err: any) {
			return { error: err.message };
		}
	}
}
