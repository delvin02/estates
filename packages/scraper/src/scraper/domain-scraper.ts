import puppeteer from "puppeteer";
import {
  BASE_URL,
  CITY_STATE_POSTCODE__ID,
  LISTING_CARD_PRICE__ID,
  PROPERTY_LISTING_RESULT__ID,
  SOLD_LISTING__PATH,
  SOLD_PRICE_TAG__ID,
  UNIT_STREET__ID,
} from "../../constants/domain";

import type { IScraper, PropertyDetail } from "../@interfaces";
import { ChalkLogger } from "../helper/chalk-logger";

export class DomainScraper implements IScraper {
  private readonly logger = new ChalkLogger();

  async scrape(postcode: string): Promise<PropertyDetail[]> {
    let allResults: PropertyDetail[] = [];
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      let pageNumber: number = 1;

      this.logger.info(`Starting to scrape postcode: ${postcode}`);
      while (true) {
        const url = `https://${BASE_URL}${SOLD_LISTING__PATH}?page=${pageNumber}&postcode=${postcode}`;
        this.logger.info(
          `Scraping Page ${pageNumber} for Postcode: ${postcode}`
        );

        const response = await page.goto(url, { waitUntil: "networkidle2" });

        if (response && response.status() === 400) {
          this.logger.info(
            `No more listings for ${postcode} on page ${pageNumber}`
          );
          break;
        }

        try {
          await page.waitForSelector(`ul[${PROPERTY_LISTING_RESULT__ID}]`, {
            timeout: 5000,
          });
        } catch (e) {
          this.logger.error(
            `Timeout: No more listings for ${postcode} on page ${pageNumber}`
          );

          break;
        }

        const results = await page.evaluate(
          (
            LISTING_CARD_PRICE__ID,
            UNIT_STREET__ID,
            CITY_STATE_POSTCODE__ID,
            SOLD_PRICE_TAG__ID,
            PROPERTY_LISTING_RESULT__ID
          ) => {
            function separateUnitAndStreet(fullAddress: string): {
              unit: string;
              street: string;
            } {
              const parts = fullAddress.trim().split(/\s+/);
              if (parts.length === 1) return { unit: parts[0], street: "" };
              const [unit, ...streetParts] = parts;
              return { unit, street: streetParts.join(" ") };
            }

            function getCityStatePostcode(element: Element): {
              city: string;
              state: string;
              postcode: string;
            } {
              const spans = element.querySelectorAll("span");
              return {
                city: spans[0]?.textContent?.trim() ?? "",
                state: spans[1]?.textContent?.trim() ?? "",
                postcode: spans[2]?.textContent?.trim() ?? "",
              };
            }

            function getPathIdentifier(url: string): string {
              const parsedUrl = new URL(url);
              const segments = parsedUrl.pathname.split("/");
              return segments.pop() || "";
            }

            function getPropertyId(url: string): string {
              return getPathIdentifier(url).split("-").pop() || "";
            }

            function getSoldDate(description: string): string {
              const tokens = description.trim().split(/\s+/);
              if (tokens.length < 3) return "";

              const [day, month, year] = tokens.slice(-3);

              return `${day} ${month} ${year}`;
            }

            function cleanInnerHtml(data: string): string {
              return data
                .replace(/<!--[\s\S]*?-->/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/[^\w\s\/\-]|_/g, "")
                .trim();
            }

            const ul = document.querySelector(
              `ul[${PROPERTY_LISTING_RESULT__ID}]`
            );
            if (!ul) return [];

            const records: PropertyDetail[] = [];
            const liElements = ul.querySelectorAll("li[data-testid]");

            liElements.forEach((li) => {
              const divPriceWrapper = li.querySelector(`
                p[${LISTING_CARD_PRICE__ID}]`);
              const divAddressLine1 = li.querySelector(`
                span[${UNIT_STREET__ID}]`);
              const divAddressLine2 = li.querySelector(
                `span[${CITY_STATE_POSTCODE__ID}]`
              );
              const hrefWrapper = li.querySelector("a.address");
              const divSoldDateWrapper = li.querySelector(
                `div[${SOLD_PRICE_TAG__ID}]`
              );

              if (
                !divPriceWrapper ||
                !divAddressLine1 ||
                !divAddressLine2 ||
                !hrefWrapper ||
                !divSoldDateWrapper
              )
                return;

              const { city, state, postcode } =
                getCityStatePostcode(divAddressLine2);

              const { unit, street } = separateUnitAndStreet(
                divAddressLine1.innerHTML
              );

              const url = hrefWrapper.getAttribute("href");

              const soldDate = getSoldDate(
                cleanInnerHtml(divSoldDateWrapper.innerHTML)
              );

              if (url) {
                const data: PropertyDetail = {
                  Url: url,
                  PathIdentifier: getPathIdentifier(url),
                  PropertyId: getPropertyId(url),
                  Price: cleanInnerHtml(divPriceWrapper.innerHTML),
                  Unit: cleanInnerHtml(unit),
                  Street: `"${cleanInnerHtml(street)}"`,
                  City: city,
                  State: state,
                  Postcode: postcode,
                  SoldDate: soldDate,
                };
                records.push(data);
              }
            });
            return records;
          },
          LISTING_CARD_PRICE__ID,
          UNIT_STREET__ID,
          CITY_STATE_POSTCODE__ID,
          SOLD_PRICE_TAG__ID,
          PROPERTY_LISTING_RESULT__ID
        );

        allResults = allResults.concat(results);
        pageNumber++;
      }
    } catch (error) {
      this.logger.error(`Error while scraping postcode ${postcode}: ${error}`);
    } finally {
      if (browser) await browser.close();
      this.logger.info("Browser closed.");
    }

    return allResults;
  }
}
