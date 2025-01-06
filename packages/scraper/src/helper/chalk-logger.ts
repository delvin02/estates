import chalk from "chalk";

export class ChalkLogger {
  info(message: string): void {
    console.log(chalk.blue(`[INFO]: ${message}`));
  }

  success(message: string): void {
    console.log(chalk.green(`[SUCCESS]: ${message}`));
  }

  error(message: string): void {
    console.log(chalk.red(`[ERROR]: ${message}`));
  }

  warning(message: string): void {
    console.log(chalk.yellow(`[WARNING]: ${message}`));
  }
}
