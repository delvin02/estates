import { POSTCODE_AREAS } from "./postcode-areas";
import type { IScraper, PropertyDetail } from "./@interfaces";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import Papa from "papaparse";
import { ChalkLogger } from "./helper/chalk-logger";

export class WorkerManager {
  private readonly logger = new ChalkLogger();
  private maxWorkers: number;
  private activeWorkers: number;
  private queue: string[];
  private scraper: IScraper;

  constructor(maxWorkers: number, scraper: IScraper) {
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.scraper = scraper;
    this.queue = this.getPostcodes();
  }

  public async run(): Promise<void> {
    while (this.activeWorkers < this.maxWorkers && this.queue.length > 0) {
      const postcode = this.queue.shift();
      if (postcode) {
        this.activeWorkers++;

        // initiate scraping process
        this.process(postcode).finally(() => {
          // free the worker for next process
          this.activeWorkers--;
          this.run();
        });
      }
    }

    if (this.activeWorkers === 0 && this.queue.length === 0) {
      this.logger.info("All scraping tasks completed!");
    }
  }

  private async process(postcode: string) {
    try {
      this.logger.info(`Worker started for postcode: ${postcode}`);
      await this.scraper.scrape(postcode);
      this.logger.info(`Worker completed for postcode: ${postcode}`);
    } catch (error) {
      this.logger.error(`Error processing postcode ${postcode}: ${error}`);
    }
  }

  private getPostcodes(): string[] {
    return Array.from(
      new Set(POSTCODE_AREAS.map((area) => area.postcode).filter(Boolean))
    );
  }
}
