export interface IScraper {
  readonly name: string;
  scrape(postcode: string): Promise<void>;
}

export interface PropertyDetail {
  Url: string;
  PathIdentifier: string;
  Price: string;
  PropertyId: string;

  // location
  Unit: string;
  Street: String;
  City: string;
  State: string;
  Postcode: string;

  SoldDate: string;

  Bed?: number;
  Bath?: number;
  Parking?: number;
  Type: string | null;
}

export interface ProxyInfo {
  host: string;
  port: number;
  username: string;
  password: string;
}
