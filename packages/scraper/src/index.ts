import { DomainScraper } from "./scraper/domain-scraper";
import { RealEstateScraper } from "./scraper/realestate-scraper";
import { WorkerManager } from "./worker-manager";

const manager = new WorkerManager(8, new RealEstateScraper());
manager.run();
