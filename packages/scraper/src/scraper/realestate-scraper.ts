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
    const proxyServerArg = `--proxy-server=http://${proxyInfo.host}:${proxyInfo.port}`;

    // might need to rotate proxies
    const { page, browser } = await connect({
      headless: false,
      args: [
        "--start-maximized",
        "--window-size=1920,1080",
        "--no-sandbox",
        // proxyServerArg,
      ],
    });

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

    try {
      // await page.authenticate({
      //   username: proxyInfo.username,
      //   password: proxyInfo.password,
      // });

      let pageNumber: number = 1;

      this.logger.info(`Starting to scrape postcode: ${postcode}`);
      while (true) {
        const url = `https://${BASE_URL}${SOLD_LISTING__PATH}${getPostCodeLinkPath(postcode)}${getListLinkPath(pageNumber)}`;
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
          await page.waitForSelector(`ul.tiered-results`, {
            timeout: 10000,
          });
        } catch (e) {
          this.logger.error(
            `Timeout: No more listings for ${postcode} on page ${pageNumber}`
          );

          console.log(e);
          break;
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
                !h2AddressWrapper ||
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
      }

      if (allResults.length > 0) {
        await this.save(allResults, postcode, batchNumber);
      }

      console.log(allResults);
    } catch (error) {
      this.logger.error(`Error while scraping postcode ${postcode}: ${error}`);
    } finally {
      // if (browser) await browser.close();
      this.logger.info("Browser closed.");
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

if (import.meta.main) {
  const scraper = new RealEstateScraper();
  scraper.scrape("5000");
}
