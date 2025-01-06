export interface IScraper {
  scrape(postcode: string): Promise<PropertyDetail[]>;
}

export interface PostcodeArea {
  postcode: string;
  suburbs: string[];
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
}
