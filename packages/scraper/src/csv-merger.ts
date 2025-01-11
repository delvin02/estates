import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * Clean CSV Row Data - Removes "$", commas, and invalid price data.
 * @param rowData The CSV row string to clean.
 * @returns Cleaned row or null if invalid.
 */
function cleanCSVRow(rowData: string, header: string[]): string | null {
  const columns = rowData.split(",");
  const priceIndex = header.indexOf("Price");

  if (priceIndex === -1) {
    throw new Error("Price column not found in the CSV header!");
  }

  // Attempt to clean the "Price" column only
  const cleanedPrice = columns[priceIndex]
    .replace(/[^\d.]/g, "") // Remove non-numeric characters
    .trim();

  // Check if the cleaned price is numeric
  if (!cleanedPrice || isNaN(Number(cleanedPrice))) {
    return null; // Skip this row if price is invalid
  }

  columns[priceIndex] = cleanedPrice; // Replace with cleaned price
  return columns.join(","); // Return the cleaned row
}

/**
 * Merge and Clean CSV Files
 */
async function mergeCSVFiles(
  baseDirectoryPath: string,
  outputFilePath: string
) {
  try {
    const subDirectories = await readdir(baseDirectoryPath, {
      withFileTypes: true,
    });
    const csvFiles: string[] = [];

    // Collect all CSV files from subdirectories
    for (const dir of subDirectories) {
      if (dir.isDirectory()) {
        const files = await readdir(path.join(baseDirectoryPath, dir.name));
        files
          .filter((file) => file.endsWith(".csv"))
          .forEach((file) => {
            csvFiles.push(path.join(baseDirectoryPath, dir.name, file));
          });
      }
    }

    let mergedData: string[] = [];
    let headersAdded = false;
    let header: string[] = [];

    for (const filePath of csvFiles) {
      const fileContent = await readFile(filePath, "utf-8");
      const lines = fileContent
        .split("\n")
        .filter((line) => line.trim() !== "");

      // Read the header only once
      if (!headersAdded) {
        header = lines[0].split(",");
        mergedData.push(lines[0]);
        headersAdded = true;
      }

      // Clean data and filter invalid rows
      const cleanedData = lines
        .slice(1)
        .map((row) => cleanCSVRow(row, header))
        .filter(Boolean) as string[];
      mergedData.push(...cleanedData);
    }

    // Write the cleaned and merged data to the output file
    await writeFile(outputFilePath, mergedData.join("\n"));
    console.log(
      `CSV files merged and cleaned successfully into ${outputFilePath}`
    );
  } catch (error) {
    console.error("Error merging and cleaning CSV files:", error);
  }
}

// Example usage
const baseDirectoryPath = "./results";
const outputFilePath = "./processed/merged.csv";
mergeCSVFiles(baseDirectoryPath, outputFilePath);
