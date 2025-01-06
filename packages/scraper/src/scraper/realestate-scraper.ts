import {
  PROPERTY_LISTING_CONTENT__CLASS,
  PROPERTY_LISTING_RESULT__CLASS,
  SOLD_PRICE_TAG__CLASS,
  ADDRESS__CLASS,
  PROPERTY_LINK__CLASS,
  BASE_URL,
  SOLD_LISTING__PATH,
} from "../../constants/realestate";

import type { IScraper, PropertyDetail } from "../@interfaces";
import { ChalkLogger } from "../helper/chalk-logger";
import { getListLinkPath, getPostCodeLinkPath } from "../helper/realestate";
import { connect } from "puppeteer-real-browser";
import { load } from "cheerio";
export class RealEstateScraper implements IScraper {
  private readonly logger = new ChalkLogger();

  async scrape(postcode: string): Promise<PropertyDetail[]> {
    let allResults: PropertyDetail[] = [];
    const { page, browser } = await connect({
      headless: false,
      args: ["--start-maximized", "--window-size=1920,1080", "--no-sandbox"],
    });

    try {
      let pageNumber: number = 1;

      this.logger.info(`Starting to scrape postcode: ${postcode}`);
      while (true) {
        const url = `https://${BASE_URL}${SOLD_LISTING__PATH}${getPostCodeLinkPath(postcode)}${getListLinkPath(pageNumber)}`;
        this.logger.info(
          `Scraping Page ${pageNumber} for Postcode: ${postcode}`
        );

        const response = await page.goto(url, {
          waitUntil: "networkidle0",
        });

        if (response && response.status() === 400) {
          this.logger.info(
            `No more listings for ${postcode} on page ${pageNumber}`
          );
          break;
        }

        console.log(PROPERTY_LISTING_RESULT__CLASS);
        try {
          console.log("waiting");
          await page.waitForSelector("ul.tiered-results", {
            timeout: 10000,
            visible: true,
          });
          console.log("OK!");
        } catch (e) {
          this.logger.error(
            `Timeout: No more listings for ${postcode} on page ${pageNumber}`
          );

          console.log(e);
          break;
        }

        const results = await page.evaluate(
          (BASE_URL, PROPERTY_LINK__CLASS) => {
            function buildFullUrl(path: string) {
              return `${BASE_URL}${path}`;
            }

            const ul = document.querySelector("ul.tiered-results");

            if (!ul) {
              console.log("no ul");
              return [];
            }

            const records: PropertyDetail[] = [];
            const liElements = ul.querySelectorAll("li");
            liElements.forEach((li) => {
              const hrefWrapper = li.querySelector(`a${PROPERTY_LINK__CLASS}`);

              if (!hrefWrapper) {
                return;
              }

              const urlPath = hrefWrapper.getAttribute("href");

              if (!urlPath) {
                return;
              }

              const data: PropertyDetail = {
                Url: buildFullUrl(urlPath),
                PathIdentifier: "test",
                PropertyId: "test",
                Price: "test",
                Unit: "test",
                Street: "test",
                City: "test",
                State: "test",
                Postcode: "test",
                SoldDate: "test",
              };
              records.push(data);
            });

            return records;
          },
          BASE_URL,
          PROPERTY_LINK__CLASS
        );

        allResults = allResults.concat(results);
        pageNumber++;
        break;
      }
      console.log(allResults);
    } catch (error) {
      this.logger.error(`Error while scraping postcode ${postcode}: ${error}`);
    } finally {
      if (browser) await browser.close();
      this.logger.info("Browser closed.");
    }

    return allResults;
  }
}

if (import.meta.main) {
  const realstate = new RealEstateScraper();
  realstate.scrape("5000");
}
