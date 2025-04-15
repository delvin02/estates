import {
  BASE_URL,
  CITY_STATE_POSTCODE__ID,
  LISTING_CARD_PRICE__ID,
  PROPERTY_LISTING_RESULT__ID,
  SOLD_LISTING__PATH,
  SOLD_PRICE_TAG__ID,
  UNIT_STREET__ID,
  PROPERTY_FEATURES_CARD_WRAPPER__ID,
  PROPERTY_FEATURES_WRAPPER__ID,
  PROPERTY_FEATURE_ELEMENT__ID,
  PROPERTY_FEATURE_TYPE__ID,
} from "../../constants/domain";
import type { IScraper, PropertyDetail } from "../@interfaces";
import { ChalkLogger } from "../helper/chalk-logger";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import Papa from "papaparse";
import { connect } from "puppeteer-real-browser";
import { Mutex } from "async-mutex";

export class DomainScraper implements IScraper {
  public name = "domain";
  private readonly logger = new ChalkLogger();
  private readonly batchSize = 1000;
  private saveMutex = new Mutex();

  async scrape(postcode: string): Promise<void> {
    let allResults: PropertyDetail[] = [];
    let batchNumber: number = 1;

    let { page, browser } = await connect({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    try {
      // const page = await browser.newPage();

      // await page.setRequestInterception(true);
      // page.on("request", (request) => {
      //   if (request.isInterceptResolutionHandled()) return;
      //   if (request.url().endsWith(".png") || request.url().endsWith(".jpg"))
      //     request.abort();
      //   else request.continue();
      // });

      let pageNumber: number = 1;

      this.logger.info(`Starting to scrape postcode: ${postcode}`);
      while (true) {
        const url = `https://${BASE_URL}${SOLD_LISTING__PATH}?page=${pageNumber}&postcode=${postcode}`;
        this.logger.info(
          `Scraping Page ${pageNumber} for Postcode: ${postcode}`
        );

        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
        });

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
            PROPERTY_LISTING_RESULT__ID,
            PROPERTY_FEATURES_CARD_WRAPPER__ID,
            PROPERTY_FEATURES_WRAPPER__ID,
            PROPERTY_FEATURE_TYPE__ID,
            PROPERTY_FEATURE_ELEMENT__ID
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
                .replace(/\/span/g, "")
                .replace(/[^\w\s\/\-]|_/g, "")
                .trim();
            }

            function getPropertyFeature(
              amount: string,
              type: string
            ): { bed?: number; bath?: number; parking?: number } {
              let result: { bed?: number; bath?: number; parking?: number } =
                {};

              switch (type.toLowerCase()) {
                case "beds":
                case "bed":
                  result.bed = parseInt(amount, 10);
                  break;
                case "baths":
                case "bath":
                  if (amount === "−") {
                    result.bath = 0;
                  } else {
                    result.bath = parseInt(amount, 10);
                  }
                  break;
                case "parking":
                  if (amount === "−") {
                    result.parking = 0;
                  } else {
                    result.parking = parseInt(amount, 10);
                  }
                  break;
                default:
                  break;
              }

              return result;
            }

            function extractPropertyType(propertyType: string): string | null {
              if (propertyType.toLowerCase().includes("apartment")) {
                return "apartment";
              } else if (propertyType.toLowerCase().includes("house")) {
                return "house";
              } else if (propertyType.toLowerCase().includes("villa")) {
                return "villa";
              } else if (propertyType.toLowerCase().includes("townhouse")) {
                return "townhouse";
              } else {
                return null;
              }
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

              const divPropertyFeatureCardWrapper = li.querySelector(
                `div[${PROPERTY_FEATURES_CARD_WRAPPER__ID}]`
              );

              if (
                !divPriceWrapper ||
                !divAddressLine1 ||
                !divAddressLine2 ||
                !hrefWrapper ||
                !divSoldDateWrapper ||
                !divPropertyFeatureCardWrapper
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

              const propertyFeatureWrapper =
                divPropertyFeatureCardWrapper.querySelector(
                  `div[${PROPERTY_FEATURES_WRAPPER__ID}]`
                );

              let propertyType = null;
              console.log(divPropertyFeatureCardWrapper);

              const propertyTypeContainer =
                divPropertyFeatureCardWrapper?.querySelectorAll("div")[2];
              console.log("test", propertyTypeContainer);

              const propertyTypeWrapper =
                propertyTypeContainer?.querySelector("span");

              if (!propertyTypeWrapper?.textContent) {
                return;
              }
              propertyType = extractPropertyType(
                propertyTypeWrapper?.textContent?.trim()
              );

              const featureElements =
                propertyFeatureWrapper?.querySelectorAll(":scope > span");
              let features: { bed?: number; bath?: number; parking?: number } =
                {};
              featureElements?.forEach((container) => {
                const spanFeatureElement = container?.querySelector(
                  `span[${PROPERTY_FEATURE_ELEMENT__ID}]`
                );
                const featureNumber = spanFeatureElement
                  ? spanFeatureElement?.firstChild?.textContent?.trim()
                  : "";
                const featureType = container?.querySelector(
                  `span[${PROPERTY_FEATURE_TYPE__ID}]`
                );

                const featureTypeText = featureType?.innerHTML
                  .trim()
                  .toLowerCase();

                if (!featureNumber || !featureTypeText) {
                  return;
                }
                const featureData = getPropertyFeature(
                  featureNumber,
                  featureTypeText
                );

                features = { ...features, ...featureData };
              });

              if (!soldDate || !postcode) {
                return;
              }
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
                  Bed: features.bed ?? 0,
                  Bath: features.bath ?? 0,
                  Parking: features.parking ?? 0,
                  Type: propertyType,
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
          PROPERTY_LISTING_RESULT__ID,
          PROPERTY_FEATURES_CARD_WRAPPER__ID,
          PROPERTY_FEATURES_WRAPPER__ID,
          PROPERTY_FEATURE_TYPE__ID,
          PROPERTY_FEATURE_ELEMENT__ID
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
    } catch (error) {
      this.logger.error(`Error while scraping postcode ${postcode}: ${error}`);
    } finally {
      if (allResults.length > 0) {
        await this.save(allResults, postcode, batchNumber);
        allResults = [];
      }
      if (browser) await browser.close();
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
          `domain-${postcode}-batch-${batchNumber}.csv`
        );

        await fs.writeFile(csvPath, csv);
        this.logger.info(`Data for postcode ${postcode} saved to: ${csvPath}`);
      } catch (error) {
        this.logger.error(
          `Error saving data for postcode ${postcode}: ${error}`
        );
      }
    });
  }
}

// if (import.meta.main) {
//   const scraper = new DomainScraper();
//   scraper.scrape("5000");
// }
