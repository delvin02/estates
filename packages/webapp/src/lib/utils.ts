import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import type { NewProperty } from './server/db/schema';
import fs from 'fs';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function parseCSVFile(filePath: string): Promise<any[]> {
	return new Promise((resolve, reject) => {
		const fileStream = fs.createReadStream(filePath);

		Papa.parse(fileStream, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false,
			complete: (results) => {
				if (results.errors.length > 0) {
					console.error('CSV parsing errors:', results.errors);
					reject(new Error('Failed to parse CSV: ' + results.errors[0].message));
				} else {
					resolve(results.data);
				}
			},
			error: (err: any) => {
				console.error('PapaParse error:', err);
				reject(err);
			}
		});
	});
}

export function mapCSVRowToProperty(rowData: any, versionId: number): NewProperty | null {
	if (
		!rowData ||
		!rowData['Street'] ||
		!rowData['City'] ||
		!rowData['State'] ||
		!rowData['Postcode']
	) {
		console.warn('Skipping row due to missing required address fields:', rowData);
		return null;
	}

	try {
		const property: NewProperty = {
			source: rowData['Url'].includes('realestate') ? 'realestate' : 'domain',
			sourceURL: rowData['Url'] ?? null,
			sourceURLIdentifier: rowData['PathIdentifier'] ?? null,
			sourcePropertyId: rowData['PropertyId'] ? parseInt(rowData['PropertyId']) : null,

			unit: rowData['Unit'] ?? null,
			street: rowData['Street'],
			city: rowData['City'],
			state: rowData['State'],
			postcode: rowData['Postcode'],

			bedrooms: rowData['Bed'] ? parseInt(rowData['Bed'], 10) : null,
			bathrooms: rowData['Bath'] ? parseInt(rowData['Bath'], 10) : null,
			parking: rowData['Parking'] ? parseInt(rowData['Parking'], 10) : null,

			price: rowData['Price'] ? parseFloat(rowData['Price']) : null,

			type: rowData['Type'] ?? null,

			// Convert 'SoldDate' from CSV string to Date object
			soldDate: rowData['SoldDate'] ? parseDDMonYY(rowData['SoldDate']) : null,

			versionId: versionId
		};

		if (
			!property.street ||
			!property.city ||
			!property.state ||
			!property.postcode ||
			property.versionId === undefined
		) {
			console.warn('Row mapping resulted in missing NOT NULL field after conversion:', rowData);
			return null;
		}

		return property;
	} catch (error) {
		console.error('Error mapping CSV row:', rowData, 'Error:', error);
		return null; // Return null for rows that fail mapping/parsing
	}
}

/**
 * Parses a date string in DD-Mon-YY format (e.g., "18-Dec-24") into a Date object.
 * Assumes 'YY' represents a year in the 21st century (2000-2099).
 *
 * @param dateString The date string to parse (e.g., "18-Dec-24"). Can be null or undefined.
 * @returns A Date object if parsing is successful, otherwise null.
 */
export function parseDDMonYY(dateString: string | null | undefined): Date | null {
	if (!dateString || typeof dateString !== 'string') {
		if (dateString !== null && dateString !== undefined) {
			console.warn(`Received non-string date input: ${dateString} (type: ${typeof dateString})`);
		}
		return null;
	}

	const parts: string[] = dateString.split('-');

	if (parts.length !== 3) {
		console.error(`Date string "${dateString}" is not in expected DD-Mon-YY format.`);
		return null;
	}

	const dayStr: string = parts[0];
	const monthAbbr: string = parts[1];
	const yearYYStr: string = parts[2];

	const day: number = parseInt(dayStr, 10);
	const yearYY: number = parseInt(yearYYStr, 10);

	const monthMap: { [key: string]: number } = {
		Jan: 0,
		Feb: 1,
		Mar: 2,
		Apr: 3,
		May: 4,
		Jun: 5,
		Jul: 6,
		Aug: 7,
		Sep: 8,
		Oct: 9,
		Nov: 10,
		Dec: 11
	};

	const monthIndex: number | undefined = monthMap[monthAbbr];

	if (isNaN(day) || monthIndex === undefined || isNaN(yearYY)) {
		console.error(
			`Could not parse date components from "${dateString}". Day: ${day}, Month: ${monthAbbr}, YearYY: ${yearYY}.`
		);
		return null;
	}

	// Determine the full year. Assuming 'YY' refers to the 21st century (2000s).
	// For example, '24' becomes 2024.
	const fullYear: number = 2000 + yearYY;

	// Create the Date object using the reliable Date(year, monthIndex, day) constructor.
	const parsedDate: Date = new Date(fullYear, monthIndex, day);

	// **Important Validation:** Check if the components of the created Date object
	// match the components we parsed from the string. This catches invalid dates
	// like "31-Feb-24" which the Date constructor might silently adjust to March 2nd.
	if (
		parsedDate.getDate() !== day ||
		parsedDate.getMonth() !== monthIndex ||
		parsedDate.getFullYear() !== fullYear
	) {
		console.error(
			`Constructed date components do not match input for "${dateString}". Parsed: ${fullYear}-${monthIndex + 1}-${day}, Constructed: ${parsedDate.getFullYear()}-${parsedDate.getMonth() + 1}-${parsedDate.getDate()}.`
		);
		return null;
	}

	return parsedDate;
}
