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
import { Mutex } from "async-mutex";

export class RealEstateScraper implements IScraper {
  public name = "realestate";
  private readonly logger = new ChalkLogger();
  private readonly batchSize = 1000;
  private rotationalProxy: RotationalProxy;
  private saveMutex = new Mutex();

  constructor() {
    this.rotationalProxy = new RotationalProxy();
  }

  async scrape(postcode: string): Promise<void> {
    let allResults: PropertyDetail[] = [];
    let batchNumber: number = 1;

    const proxyInfo = this.rotationalProxy.getNextProxy();

    let { page, browser } = await connect({
      headless: false,
      args: ["--disable-setuid-sandbox"],
      // proxy: proxyInfo,
    });

    // might need to rotate proxies

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
    let stopScraping = false;

    try {
      while (!stopScraping && !retryFinished) {
        // let success = false;

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
              stopScraping = true;
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

        if (retryFinished) {
          break;
        }

        const { results, shouldStop } = await page.evaluate(
          (
            postcode,
            PROPERTY_LISTING_RESULT__CLASS,
            BASE_URL,
            SOLD_PRICE_TAG__CLASS,
            PROPERTY_LINK__CLASS,
            PROPERTY_LISTING_CONTENT__CLASS,
            ADDRESS__CLASS
          ) => {
            let shouldStop = false;
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

            function getYearFromSoldDate(
              soldDateDescription: string
            ): number | null {
              // assuming the the soldDateDescription would always be in this format
              // 12 Jan 2024
              const date = new Date(Date.parse(soldDateDescription));
              return date.getFullYear();
            }

            const ul = document.querySelector(
              `ul${PROPERTY_LISTING_RESULT__CLASS}`
            );

            if (!ul) {
              console.log("no ul");
              return { results: [], shouldStop: false };
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

              const ulPropertyDetailWrapper = li.querySelector(
                `ul .residential-card__primary`
              );
              console.log(ulPropertyDetailWrapper);
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
              const featureElements = ulPropertyDetailWrapper
                ?.querySelectorAll("div")[0]
                ?.querySelectorAll("li");

              let property: { bed?: number; bath?: number; parking?: number } =
                { bed: 0, bath: 0, parking: 0 };
              featureElements?.forEach((element) => {
                const label =
                  (element as HTMLElement)
                    .getAttribute("aria-label")
                    ?.toLowerCase() || "";
                const amount =
                  (element.querySelector("p") as HTMLElement)?.textContent ||
                  "−";

                if (label.includes("bed")) {
                  property.bed = amount === "−" ? 0 : parseInt(amount, 10);
                } else if (label.includes("bath")) {
                  property.bath = amount === "−" ? 0 : parseInt(amount, 10);
                } else if (label.includes("car space")) {
                  property.parking = amount === "−" ? 0 : parseInt(amount, 10);
                }
              });

              const propertyTypeWrapper =
                ulPropertyDetailWrapper?.querySelector(":scope > p");

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

              const soldYear = getYearFromSoldDate(soldDate);
              if (soldYear && soldYear < 2022) {
                console.log("year is lesser than 2022, stop scraping.");
                shouldStop = true;
              }
              const propertyType = propertyTypeWrapper?.textContent;
              if (!propertyId || !price || !soldDate || !propertyType) {
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
                Bed: property.bed,
                Bath: property.bath,
                Parking: property.parking,
                Type: propertyType,
              };
              records.push(data);
            });
            return { results: records, shouldStop };
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

        if (shouldStop) {
          this.logger.warning(
            `Stopping scraping as soldDate is before the year 2022.`
          );
          stopScraping = true;
          break;
        }

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
      if (browser) browser.close();
      this.logger.info("Browser closed.");
    }
  }
  private async save(
    data: PropertyDetail[],
    postcode: string,
    batchNumber: number
  ): Promise<void> {
    await this.saveMutex.runExclusive(async () => {
      try {
        const outputDir = resolve(__dirname, `../../results/${this.name}`);
        await fs.mkdir(outputDir, { recursive: true });

        if (data.length === 0) {
          this.logger.warning(`No data to save for postcode ${postcode}`);
          return;
        }

        const csv = Papa.unparse(data);
        const csvPath = join(
          outputDir,
          `realestate-${postcode}-batch-${batchNumber}.csv`
        );
        await fs.writeFile(csvPath, csv);
        this.logger.success(
          `Data for postcode ${postcode} saved to: ${csvPath}`
        );
      } catch (error) {
        this.logger.error(
          `Error saving data for postcode ${postcode}: ${error}`
        );
      }
    });
  }
}

// if (import.meta.main) {
//   const scraper = new RealEstateScraper();
//   scraper.scrape("5000");
// }
