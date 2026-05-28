// rotational-proxy.ts

import fs from "fs";
import path from "path";
import type { ProxyOptions } from "puppeteer-real-browser";

export class RotationalProxy {
  private proxies: ProxyOptions[] = [];
  private currentIndex = 0;

  constructor() {
    this.loadProxiesFromFile();
  }

  /**
   * Reads proxies.txt, parses each line, and stores them in `this.proxies`.
   */
  private loadProxiesFromFile(): void {
    try {
      // 1. Read the file. Adjust the path if proxies.txt is located elsewhere.
      const filePath = path.resolve(__dirname, "./iproyal.txt");
      const fileData = fs.readFileSync(filePath, "utf-8");

      // 2. Split into lines and parse each line
      const lines = fileData
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""); // remove empty lines

      for (const line of lines) {
        // Expected format: host:port:username:password
        const [host, port, username, password] = line.split(":");

        // Convert port to a number
        const portAsNumber = Number(port);

        // Basic validation checks
        if (!host || !portAsNumber || !username || !password) {
          console.warn(`Invalid proxy format: ${line}`);
          continue;
        }

        // Build the ProxyInfo object
        const proxyInfo: ProxyOptions = {
          host,
          port: portAsNumber,
          username,
          password,
        };

        this.proxies.push(proxyInfo);
      }

      if (this.proxies.length === 0) {
        console.warn("No valid proxies loaded from proxies.txt");
      }
    } catch (error) {
      console.error("Failed to read proxies.txt", error);
    }
  }

  /**
   * Return the next proxy in rotation
   */
  public getNextProxy(): ProxyOptions {
    if (this.proxies.length === 0) {
      throw new Error(
        "No proxies available. Make sure proxies.txt is populated."
      );
    }
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }
}
