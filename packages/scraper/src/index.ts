import { DomainScraper } from "./scraper/domain-scraper";
import { WorkerManager } from "./worker-manager";

const manager = new WorkerManager(8, new DomainScraper());
manager.run();
