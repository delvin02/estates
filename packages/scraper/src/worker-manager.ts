import { POSTCODES } from "./postcodes";
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
    this.queue = POSTCODES;
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
      const data = await this.scraper.scrape(postcode);

      if (data.length > 0) {
        await this.save(data, postcode);
      }

      this.logger.info(`Worker completed for postcode: ${postcode}`);
    } catch (error) {
      this.logger.error(`Error processing postcode ${postcode}: ${error}`);
    }
  }

  private async save(data: PropertyDetail[], postcode: string): Promise<void> {
    try {
      const outputDir = resolve(__dirname, "../results/domain");
      await fs.mkdir(outputDir, { recursive: true });
      const csv = Papa.unparse(data);
      const csvPath = join(outputDir, `domain-${postcode}.csv`);
      await fs.writeFile(csvPath, csv);
      this.logger.info(`Data for postcode ${postcode} saved to: ${csvPath}`);
    } catch (error) {
      this.logger.error(`Error saving data for postcode ${postcode}: ${error}`);
    }
  }
}
