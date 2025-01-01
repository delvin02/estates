import puppeteer from "puppeteer";
import { LISTING_CARD_PRICE__ID, UNIT_STREET__ID } from "./constants";
import { cleanInnerHtml, separateUnitAndStreet } from "./utils";

interface PropertyDetail {
  PathIdentifier: string;
  Price: string;

  // location
  Unit: string;
  Street: String;
}

export async function runScraper() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      devtools: true,
    });

    const page = await browser.newPage();

    await page.goto(
      "https://www.domain.com.au/sold-listings?page=1&postcode=5000",
      {
        waitUntil: "networkidle2",
      }
    );

    await page.waitForSelector('ul[data-testid="results"]');

    const results = await page.evaluate(
      (LISTING_CARD_PRICE__ID, UNIT_STREET__ID) => {
        function separateUnitAndStreet(fullAddress: string): {
          unit: string;
          street: string;
        } {
          // Trim and split by one or more spaces
          const parts = fullAddress.trim().split(/\s+/);

          if (parts.length === 1) {
            // Edge case: only one token, e.g. "1304/421"
            return {
              unit: parts[0],
              street: "",
            };
          }

          // The first token is considered the 'unit'
          const [unit, ...streetParts] = parts;

          // Join the remaining tokens for the street
          // Convert to lowercase if you want "king william street"
          // instead of "King William Street"
          const street = streetParts.join(" ").toLowerCase();

          return { unit, street };
        }

        function cleanInnerHtml(data: string): string {
          return data.replace(/<!--[\s\S]*?-->/g, "");
        }

        const ul = document.querySelector('ul[data-testid="results"]');
        if (!ul) return [];

        const records: PropertyDetail[] = [];

        const liElements = ul.querySelectorAll("li[data-testid]");
        Array.from(liElements).map((li) => {
          const divPriceWrapper = li.querySelector(
            `p[${LISTING_CARD_PRICE__ID}]`
          );
          if (!divPriceWrapper) {
            return null;
          }

          const divAddressLine1 = li.querySelector(`span[${UNIT_STREET__ID}]`);
          if (!divAddressLine1) {
            return null;
          }

          const { unit, street } = separateUnitAndStreet(
            divAddressLine1.innerHTML
          );
          console.log(unit, street);
          const data: PropertyDetail = {
            PathIdentifier: "test",
            Price: cleanInnerHtml(divPriceWrapper.innerHTML),
            Unit: cleanInnerHtml(unit),
            Street: cleanInnerHtml(street),
          };
          records.push(data);
        });

        return records;
      },
      LISTING_CARD_PRICE__ID,
      UNIT_STREET__ID
    );
    console.log(results);
    // results.forEach((result) => {
    //   console.log("=== LOG ===");
    //   console.log(result.Price);
    // });
    await browser.close();
    console.log("Browser closed.");
  } catch (error) {
    console.error("Error in scraper:", error);
    if (browser) {
      await browser.close();
    }
  }
}

// If you run this file directly: `bun run src/scrape.ts`
if (import.meta.main) {
  runScraper();
}
