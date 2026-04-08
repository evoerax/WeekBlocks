import {
  ItemView,
  Notice,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import { CUSTOM_BLOCKS_HEADING, VIEW_TYPE_WEEKLY_LOG } from "../constants";
import { WeeklyLogService } from "../service/weekly-log-service";
import type { CustomTimeBlock, DayLog, LogEntry, SlotLog, WeeklyLog } from "../types";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;

function currentTimeLabel(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function createDefaultEntry(): LogEntry {
  return {
    time: currentTimeLabel(),
    tag: "记录",
    text: "新记录",
  };
}

function createDefaultBlock(): CustomTimeBlock {
  return {
    startTime: "09:00",
    endTime: "10:00",
    tag: "记录",
    text: "新时间块",
  };
}

export class WeeklyLogView extends ItemView {
  private currentFile: TFile | null = null;
  private log: WeeklyLog | null = null;
  private errorMessage = "";

  constructor(
    leaf: WorkspaceLeaf,
    private readonly service: WeeklyLogService,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_WEEKLY_LOG;
  }

  getDisplayText(): string {
    return "WeekBlocks";
  }

  getIcon(): string {
    return "calendar-days";
  }

  getCurrentFilePath(): string | null {
    return this.currentFile?.path ?? null;
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("weekblocks-view");
    await this.loadCurrentWeek();
  }

  async loadCurrentWeek(): Promise<void> {
    try {
      this.errorMessage = "";
      this.currentFile = await this.service.ensureCurrentWeekFile();
      this.log = await this.service.readLog(this.currentFile);
    } catch (error) {
      this.log = null;
      this.errorMessage = getErrorMessage(error);
    }

    this.render();
  }

  async reloadFromFile(file: TFile): Promise<void> {
    try {
      this.currentFile = file;
      this.log = await this.service.readLog(file);
      this.errorMessage = "";
    } catch (error) {
      this.log = null;
      this.errorMessage = getErrorMessage(error);
    }

    this.render();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    const shell = contentEl.createDiv({ cls: "weekblocks-shell" });
    if (this.errorMessage) {
      const errorEl = shell.createDiv({ cls: "weekblocks-error" });
      errorEl.setText(this.errorMessage);
    }

    if (!this.log) {
      const emptyEl = shell.createDiv({ cls: "weekblocks-empty" });
      emptyEl.setText("无法加载本周记录。");
      return;
    }

    this.renderHeader(shell, this.log);
    const grid = shell.createDiv({ cls: "weekblocks-grid" });

    for (const day of this.log.days) {
      this.renderDay(grid, day);
    }
  }

  private renderHeader(container: HTMLElement, log: WeeklyLog): void {
    const header = container.createDiv({ cls: "weekblocks-header" });
    const titleGroup = header.createDiv({ cls: "weekblocks-header-copy" });
    titleGroup.createEl("h2", {
      cls: "weekblocks-title",
      text: `${log.weekId} 周记录`,
    });
    titleGroup.createDiv({
      cls: "weekblocks-subtitle",
      text: `${log.startDate} - ${log.endDate}`,
    });

    const refreshButton = header.createEl("button", {
      cls: "mod-cta",
      text: "刷新",
    });
    refreshButton.addEventListener("click", () => {
      void this.loadCurrentWeek();
    });
  }

  private renderDay(container: HTMLElement, day: DayLog): void {
    const dayCard = container.createDiv({ cls: "weekblocks-day" });
    const dayHeader = dayCard.createDiv({ cls: "weekblocks-day-header" });
    dayHeader.createEl("h3", { text: day.title });

    for (const slotLog of day.slotLogs) {
      this.renderSlot(dayCard, day, slotLog);
    }

    this.renderCustomBlocks(dayCard, day);
  }

  private renderSlot(container: HTMLElement, day: DayLog, slotLog: SlotLog): void {
    const section = container.createDiv({ cls: "weekblocks-section" });
    const sectionHeader = section.createDiv({ cls: "weekblocks-section-header" });
    sectionHeader.createEl("h4", {
      cls: "weekblocks-section-title",
      text: slotLog.slotName,
    });

    const addButton = sectionHeader.createEl("button", {
      cls: "weekblocks-add-button",
      text: "添加",
    });
    addButton.addEventListener("click", () => {
      slotLog.entries.push(createDefaultEntry());
      void this.persistAndRender();
    });

    const entries = section.createDiv({ cls: "weekblocks-entry-list" });
    if (slotLog.entries.length === 0) {
      entries.createDiv({
        cls: "weekblocks-placeholder",
        text: "这段时间还没有记录",
      });
      return;
    }

    slotLog.entries.forEach((entry, entryIndex) => {
      this.renderEntryRow(entries, {
        timeValue: entry.time,
        tagValue: entry.tag,
        textValue: entry.text,
        timeLabel: "时间",
        tagLabel: "标签",
        textLabel: "内容",
        onTimeChange: (value) => {
          entry.time = value;
        },
        onTagChange: (value) => {
          entry.tag = value;
        },
        onTextChange: (value) => {
          entry.text = value;
        },
        onDelete: () => {
          slotLog.entries.splice(entryIndex, 1);
          void this.persistAndRender();
        },
        validate: () => {
          if (!TIME_PATTERN.test(entry.time)) {
            throw new Error(`"${day.title}" / "${slotLog.slotName}" 的时间必须是 HH:MM。`);
          }
          if (!entry.tag.trim() || !entry.text.trim()) {
            throw new Error(`"${day.title}" / "${slotLog.slotName}" 的记录标签和内容不能为空。`);
          }
        },
      });
    });
  }

  private renderCustomBlocks(container: HTMLElement, day: DayLog): void {
    const section = container.createDiv({ cls: "weekblocks-section weekblocks-custom-blocks" });
    const sectionHeader = section.createDiv({ cls: "weekblocks-section-header" });
    sectionHeader.createEl("h4", {
      cls: "weekblocks-section-title",
      text: CUSTOM_BLOCKS_HEADING,
    });

    const addButton = sectionHeader.createEl("button", {
      cls: "weekblocks-add-button",
      text: "添加",
    });
    addButton.addEventListener("click", () => {
      day.customBlocks.push(createDefaultBlock());
      void this.persistAndRender();
    });

    const blocks = section.createDiv({ cls: "weekblocks-entry-list" });
    if (day.customBlocks.length === 0) {
      blocks.createDiv({
        cls: "weekblocks-placeholder",
        text: "没有自定义时间块",
      });
      return;
    }

    day.customBlocks.forEach((block, blockIndex) => {
      this.renderEntryRow(blocks, {
        timeValue: `${block.startTime}-${block.endTime}`,
        tagValue: block.tag,
        textValue: block.text,
        timeLabel: "时间段",
        tagLabel: "标签",
        textLabel: "内容",
        onTimeChange: (value) => {
          const [startTime = "", endTime = ""] = value.split("-", 2);
          block.startTime = startTime;
          block.endTime = endTime;
        },
        onTagChange: (value) => {
          block.tag = value;
        },
        onTextChange: (value) => {
          block.text = value;
        },
        onDelete: () => {
          day.customBlocks.splice(blockIndex, 1);
          void this.persistAndRender();
        },
        validate: () => {
          if (!TIME_PATTERN.test(block.startTime) || !TIME_PATTERN.test(block.endTime)) {
            throw new Error(`"${day.title}" 的自定义时间块必须是 HH:MM-HH:MM。`);
          }
          if (!block.tag.trim() || !block.text.trim()) {
            throw new Error(`"${day.title}" 的自定义时间块标签和内容不能为空。`);
          }
        },
      });
    });
  }

  private renderEntryRow(
    container: HTMLElement,
    config: {
      timeValue: string;
      tagValue: string;
      textValue: string;
      timeLabel: string;
      tagLabel: string;
      textLabel: string;
      onTimeChange: (value: string) => void;
      onTagChange: (value: string) => void;
      onTextChange: (value: string) => void;
      onDelete: () => void;
      validate: () => void;
    },
  ): void {
    const row = container.createDiv({ cls: "weekblocks-entry-row" });
    const timeInput = this.createInputField(row, config.timeLabel, config.timeValue);
    const tagInput = this.createInputField(row, config.tagLabel, config.tagValue);
    const textInput = this.createInputField(row, config.textLabel, config.textValue, true);

    const removeButton = row.createEl("button", {
      cls: "weekblocks-remove-button",
      text: "删除",
    });
    removeButton.addEventListener("click", config.onDelete);

    timeInput.addEventListener("change", () => {
      config.onTimeChange(timeInput.value.trim());
      void this.persistWithValidation(config.validate);
    });

    tagInput.addEventListener("change", () => {
      config.onTagChange(tagInput.value.trim());
      void this.persistWithValidation(config.validate);
    });

    textInput.addEventListener("change", () => {
      config.onTextChange(textInput.value.trim());
      void this.persistWithValidation(config.validate);
    });
  }

  private createInputField(
    container: HTMLElement,
    label: string,
    value: string,
    grow = false,
  ): HTMLInputElement {
    const field = container.createDiv({
      cls: `weekblocks-field${grow ? " weekblocks-field-grow" : ""}`,
    });
    field.createEl("label", {
      cls: "weekblocks-field-label",
      text: label,
    });
    const input = field.createEl("input", { type: "text" });
    input.value = value;
    return input;
  }

  private async persistWithValidation(validate: () => void): Promise<void> {
    try {
      validate();
      await this.persist();
    } catch (error) {
      this.handleError(error);
    }
  }

  private async persistAndRender(): Promise<void> {
    try {
      await this.persist();
      this.render();
    } catch (error) {
      this.handleError(error);
    }
  }

  private async persist(): Promise<void> {
    if (!this.currentFile || !this.log) {
      throw new Error("当前没有可保存的周记录文件。");
    }

    await this.service.saveLog(this.currentFile, this.log);
    this.errorMessage = "";
  }

  private handleError(error: unknown): void {
    this.errorMessage = getErrorMessage(error);
    this.render();
    new Notice(this.errorMessage);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "发生未知错误。";
}
