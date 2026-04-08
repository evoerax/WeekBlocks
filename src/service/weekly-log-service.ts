import type { App, TFile } from "obsidian";
import {
  DEFAULT_SLOT_NAMES,
  DEFAULT_WEEKLY_FOLDER,
} from "../constants";
import { getWeekInfoFromDate } from "../date/week";
import { parseWeeklyLog } from "../markdown/parser";
import { serializeWeeklyLog } from "../markdown/serializer";
import { buildWeeklyLogTemplate } from "../markdown/template";
import type { WeeklyLog } from "../types";

export interface WeeklyLogServiceOptions {
  folderPath?: string;
  slotNames?: string[];
  now?: () => Date;
}

export class WeeklyLogService {
  constructor(
    private readonly app: App,
    private readonly options: WeeklyLogServiceOptions = {},
  ) {}

  getCurrentWeekPath(): string {
    const { weekId } = this.getCurrentWeekInfo();
    return `${this.getFolderPath()}/${weekId}.md`;
  }

  async ensureCurrentWeekFile(): Promise<TFile> {
    const folderPath = this.getFolderPath();
    await this.ensureFolderExists(folderPath);

    const filePath = this.getCurrentWeekPath();
    const existingFile = this.app.vault.getFileByPath(filePath);
    if (existingFile) {
      return existingFile;
    }

    const weekInfo = this.getCurrentWeekInfo();
    return this.app.vault.create(
      filePath,
      buildWeeklyLogTemplate({
        ...weekInfo,
        slotNames: this.getSlotNames(),
      }),
    );
  }

  async readLog(file: TFile): Promise<WeeklyLog> {
    const markdown = await this.app.vault.cachedRead(file);
    return parseWeeklyLog(markdown);
  }

  async saveLog(file: TFile, log: WeeklyLog): Promise<void> {
    await this.app.vault.modify(file, serializeWeeklyLog(log));
  }

  private getCurrentWeekInfo() {
    return getWeekInfoFromDate(this.getNow()());
  }

  private getFolderPath(): string {
    const folderPath = this.options.folderPath?.trim().replace(/^\/+|\/+$/gu, "");
    return folderPath && folderPath.length > 0
      ? folderPath
      : DEFAULT_WEEKLY_FOLDER;
  }

  private getNow(): () => Date {
    return this.options.now ?? (() => new Date());
  }

  private getSlotNames(): string[] {
    return [...(this.options.slotNames ?? DEFAULT_SLOT_NAMES)];
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    if (this.app.vault.getFolderByPath(folderPath)) {
      return;
    }

    if (this.app.vault.getFileByPath(folderPath)) {
      throw new Error(`Weekly log folder path "${folderPath}" is already a file.`);
    }

    let currentPath = "";
    for (const segment of folderPath.split("/").filter(Boolean)) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      if (this.app.vault.getFolderByPath(currentPath)) {
        continue;
      }

      if (this.app.vault.getFileByPath(currentPath)) {
        throw new Error(`Weekly log folder path "${currentPath}" is already a file.`);
      }

      await this.app.vault.createFolder(currentPath);
    }
  }
}
