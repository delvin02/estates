import { IN_POSTCODE__PATH, LIST__PATH } from "../../constants/realestate";

/**
 * Constructs a URL path for searching sold properties in a specific postcode.
 *
 * Example Usage:
 *   getPostCodeLinkPath('5000')
 *   Output: "/sold/in-5000"
 *
 * @param {string} postcode - The postcode to search for properties.
 * @returns {string} - The complete URL path for the specified postcode.
 */
export function getPostCodeLinkPath(postcode: string): string {
  // Builds the URL for sold properties based on the postcode provided
  return `${IN_POSTCODE__PATH}${postcode}`;
}

/**
 * Constructs a URL path for listing properties based on the page identifier.
 *
 * Example Usage:
 *   getListLinkPath('page-2')
 *   Output: "/list/page-2"
 *
 * @param {string} page - The page identifier to search for properties (e.g., pagination).
 * @returns {string} - The complete URL path for the specified page.
 */
export function getListLinkPath(page: number | string): string {
  // Builds the URL for listing properties based on the page identifier provided
  return `${LIST__PATH}${page.toString()}`;
}
