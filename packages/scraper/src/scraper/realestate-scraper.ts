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

        try {
          await page.waitForSelector("ul.tiered-results", {
            timeout: 10000,
            visible: true,
          });
        } catch (e) {
          this.logger.error(
            `Timeout: No more listings for ${postcode} on page ${pageNumber}`
          );

          console.log(e);
          break;
        }
        console.log("evaluate now");
        const results = await page.evaluate(
          (postcode, BASE_URL, SOLD_PRICE_TAG__CLASS, PROPERTY_LINK__CLASS, PROPERTY_LISTING_CONTENT__CLASS, ADDRESS__CLASS) => {
            function buildFullUrl(path: string) {
              return `${BASE_URL}${path}`;
            }

            function extractNumericValue(amount: string): string {
              return amount.replace(/[$,]/g, '');
            }

            function extractIdFromHref(path: string): string {
              const match = path.match(/(\d+)$/);
              return match ? match[1] : '';
            }

            
            function extractSoldDate(description: string): string {
              const parts = description.split(" ");
              const date = parts.slice(2).join(" ");
              return date;
            }

            function extractUnitStreetAndCity(address: string): any {
              const match = address.match(/^(\d+)\s([\w\s]+)\sStreet,\s([\w\s]+)$/);
              if (!match) return {};

              const unit = match[1];
              const street = match[2].trim();
              const city = match[3].trim();
              return {unit, street, city};
            }
            console.log("ul now")
            const ul = document.querySelector("ul.tiered-results");

            if (!ul) {
              console.log("no ul");
              return [];
            }
            console.log("ul checked")

            const records: PropertyDetail[] = [];
            const liElements = ul.querySelectorAll("li");
            liElements.forEach((li) => {
              console.log(li);
              const hrefWrapper = li.querySelector(`a${PROPERTY_LINK__CLASS}`);
              const divPriceWrapper = li.querySelector(`div${SOLD_PRICE_TAG__CLASS}`)
              const divSoldDateWrapper = li.querySelector(`div .residential-card__content span`)
              const h2AddressWrapper = li.querySelector(`h2.residential-card__address-heading span`);

              if (!hrefWrapper || !divPriceWrapper || !divSoldDateWrapper || !h2AddressWrapper) {
                console.log("Wrapper not found");
                return;
              }

              const pathIdentifier = hrefWrapper.getAttribute("href");
              const soldDateDescription = divSoldDateWrapper.textContent;
              console.log('s', soldDateDescription);
              const address = h2AddressWrapper.textContent;
              if (!divPriceWrapper.textContent || !pathIdentifier || !soldDateDescription || !address) {
                return;
              }

              const price = extractNumericValue(divPriceWrapper.textContent);
              const propertyId = extractIdFromHref(pathIdentifier);
              const soldDate = extractSoldDate(soldDateDescription);
              const {unit, street, city} = extractUnitStreetAndCity(address);

              if ( !propertyId || !soldDate || !propertyId ) {
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
                Postcode: "5000",
                SoldDate: soldDate,
              };
              records.push(data);
            });

            return records;
          },
          postcode,
          BASE_URL,
          SOLD_PRICE_TAG__CLASS,
          PROPERTY_LINK__CLASS,
          PROPERTY_LISTING_CONTENT__CLASS,
          ADDRESS__CLASS
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
