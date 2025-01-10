import {
  BASE_URL,
  SOLD_LISTING__PATH,
  PROPERTY_LISTING_RESULT__CLASS,
  PROPERTY_LISTING_CONTENT__CLASS,
  ADDRESS__CLASS,
  SOLD_PRICE_TAG__CLASS,
  PROPERTY_LINK__CLASS,
} from "../../constants/realestate";
import type { IScraper, PropertyDetail } from "../@interfaces";
import { ChalkLogger } from "../helper/chalk-logger";
import { getListLinkPath, getPostCodeLinkPath } from "../helper/realestate";
import { connect } from "puppeteer-real-browser";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import Papa from "papaparse";
import { RotationalProxy } from "../proxy/proxy";

export class RealEstateScraper implements IScraper {
  public name = "realestate";
  private readonly logger = new ChalkLogger();
  private readonly batchSize = 1000;
  private rotationalProxy: RotationalProxy;

  constructor() {
    this.rotationalProxy = new RotationalProxy();
  }

  async scrape(postcode: string): Promise<void> {
    let allResults: PropertyDetail[] = [];
    let batchNumber: number = 1;

    const proxyInfo = this.rotationalProxy.getNextProxy();

    let { page, browser } = await connect({
      headless: true,
      args: [
        "--start-maximized",
        "--window-size=1920,1080",
        "--disable-setuid-sandbox",
      ],
      // proxy: proxyInfo,
    });

    // might need to rotate proxies

    // await page.goto("https://google.com")

    // await page.realCursor.moveTo({ x: Math.random() * 800, y: Math.random() * 600 });

    // await page.setRequestInterception(true);
    // page.on("request", (request) => {
    //   if (
    //     ["image", "stylesheet", "font", "media"].includes(
    //       request.resourceType()
    //     )
    //   ) {
    //     request.abort();
    //   } else {
    //     request.continue();
    //   }
    // });

    let pageNumber: number = 1;

    this.logger.info(`Starting to scrape postcode: ${postcode}`);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000;
    let retryFinished = false;

    try {
      while (true && !retryFinished) {
        let success = false;

        for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
          try {
            const url = `https://${BASE_URL}${SOLD_LISTING__PATH}${getPostCodeLinkPath(postcode)}${getListLinkPath(pageNumber)}`;
            this.logger.info(
              `Scraping Page ${pageNumber} for Postcode: ${postcode}`
            );

            const response = await page.goto(url, {
              waitUntil: "networkidle2",
            });

            if (response && response.status() === 400) {
              this.logger.info(
                `No more listings for ${postcode} on page ${pageNumber}`
              );
              break; // Exit the loop as there are no more listings
            }

            await page.waitForSelector(`ul.tiered-results`, { timeout: 10000 });
            break;
          } catch (error) {
            this.logger.error(
              `Attempt ${retryCount + 1} failed for postcode: ${postcode} on page ${pageNumber}`
            );

            if (retryCount < MAX_RETRIES - 1) {
              this.logger.info(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            } else {
              this.logger.error(
                `Max retries reached. Skipping postcode: ${postcode} on page ${pageNumber}`
              );
              retryFinished = true;
            }
          }
        }

        const results = await page.evaluate(
          (
            postcode,
            PROPERTY_LISTING_RESULT__CLASS,
            BASE_URL,
            SOLD_PRICE_TAG__CLASS,
            PROPERTY_LINK__CLASS,
            PROPERTY_LISTING_CONTENT__CLASS,
            ADDRESS__CLASS
          ) => {
            console.log(PROPERTY_LISTING_RESULT__CLASS);
            function buildFullUrl(path: string) {
              return `${BASE_URL}${path}`;
            }

            function extractNumericValue(amount: string): string {
              return amount.replace(/[$,]/g, "");
            }

            function extractIdFromHref(path: string): string {
              const match = path.match(/(\d+)$/);
              return match ? match[1] : "";
            }

            function extractSoldDate(description: string): string {
              const parts = description.split(" ");
              const date = parts.slice(2).join(" ");
              return date;
            }

            function extractUnitStreetAndCity(address: string): any {
              const parts = address.split(",");

              if (parts.length < 2) {
                return {};
              }
              const city = parts[parts.length - 1].trim();

              const unitAndStreet = parts
                .slice(0, parts.length - 1)
                .join(",")
                .trim();
              const tokens = unitAndStreet.split(/\s+/);

              if (tokens.length < 2) {
                return {};
              }

              const unit = tokens[0];
              const street = tokens.slice(1).join(" ");

              return { unit, street, city };
            }

            const ul = document.querySelector(
              `ul${PROPERTY_LISTING_RESULT__CLASS}`
            );

            if (!ul) {
              console.log("no ul");
              return [];
            }

            const records: PropertyDetail[] = [];
            const liElements = ul.querySelectorAll("li");
            liElements.forEach((li) => {
              console.log(li);
              const hrefWrapper = li.querySelector(`a${PROPERTY_LINK__CLASS}`);
              const divPriceWrapper = li.querySelector(
                `div${SOLD_PRICE_TAG__CLASS}`
              );
              const soldDateWrapper = li.querySelector(
                `div${PROPERTY_LISTING_CONTENT__CLASS} > div > span`
              );
              const h2AddressWrapper = li.querySelector(
                `h2${ADDRESS__CLASS} span`
              );

              if (
                !hrefWrapper ||
                !divPriceWrapper ||
                !soldDateWrapper ||
                !h2AddressWrapper
              ) {
                return;
              }

              const pathIdentifier = hrefWrapper.getAttribute("href");
              const soldDateDescription = soldDateWrapper.textContent;
              const address = h2AddressWrapper.textContent;
              const priceTag = divPriceWrapper.textContent;
              if (
                !pathIdentifier ||
                !soldDateDescription ||
                !priceTag ||
                !address
              ) {
                return;
              }

              const price = extractNumericValue(priceTag);
              const propertyId = extractIdFromHref(pathIdentifier);
              const soldDate = extractSoldDate(soldDateDescription);
              const { unit, street, city } = extractUnitStreetAndCity(address);

              if (!propertyId || !price || !soldDate) {
                return;
              }

              const data: PropertyDetail = {
                Url: buildFullUrl(pathIdentifier),
                PathIdentifier: pathIdentifier,
                PropertyId: propertyId,
                Price: price,
                Unit: unit,
                Street: street,
                City: city,
                State: "SA",
                Postcode: postcode,
                SoldDate: soldDate,
              };
              records.push(data);
            });

            return records;
          },
          postcode,
          PROPERTY_LISTING_RESULT__CLASS,
          BASE_URL,
          SOLD_PRICE_TAG__CLASS,
          PROPERTY_LINK__CLASS,
          PROPERTY_LISTING_CONTENT__CLASS,
          ADDRESS__CLASS
        );

        allResults = allResults.concat(results);

        if (allResults.length >= this.batchSize) {
          await this.save(allResults, postcode, batchNumber);
          allResults = [];
          batchNumber++;
        }

        pageNumber++;

        // sleep to make it less obvious
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (e) {
      this.logger.error(`Unhandled error: ${e}`);
    } finally {
      if (allResults.length > 0) {
        await this.save(allResults, postcode, batchNumber);
      }
    }
  }
  private async save(
    data: PropertyDetail[],
    postcode: string,
    batchNumber: number
  ): Promise<void> {
    try {
      const outputDir = resolve(__dirname, `../../results/${this.name}`);
      await fs.mkdir(outputDir, { recursive: true });
      const csv = Papa.unparse(data);
      const csvPath = join(
        outputDir,
        `realestate-${postcode}-batch-${batchNumber}.csv`
      );
      await fs.writeFile(csvPath, csv);
      this.logger.success(`Data for postcode ${postcode} saved to: ${csvPath}`);
    } catch (error) {
      this.logger.error(`Error saving data for postcode ${postcode}: ${error}`);
    }
  }
}

// if (import.meta.main) {
//   const scraper = new RealEstateScraper();
//   scraper.scrape("5031");
// }
