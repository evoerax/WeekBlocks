import { describe, expect, it } from "vitest";
import type { App, TFile, TFolder } from "obsidian";
import { DEFAULT_SLOT_NAMES } from "../src/constants";
import { parseWeeklyLog } from "../src/markdown/parser";
import { buildWeeklyLogTemplate } from "../src/markdown/template";
import { WeeklyLogService } from "../src/service/weekly-log-service";
import type { WeeklyLog } from "../src/types";

type FileRecord = {
  file: TFile;
  content: string;
};

class FakeVault {
  private readonly folders = new Map<string, TFolder>();
  private readonly files = new Map<string, FileRecord>();
  readonly createFolderCalls: string[] = [];
  readonly createCalls: Array<{ path: string; data: string }> = [];
  readonly modifyCalls: Array<{ path: string; data: string }> = [];

  constructor() {
    this.folders.set("", this.makeFolder(""));
  }

  getFileByPath(path: string): TFile | null {
    return this.files.get(path)?.file ?? null;
  }

  getFolderByPath(path: string): TFolder | null {
    return this.folders.get(path) ?? null;
  }

  async createFolder(path: string): Promise<TFolder> {
    const existing = this.folders.get(path);
    if (existing) {
      return existing;
    }

    const folder = this.makeFolder(path);
    this.folders.set(path, folder);
    this.createFolderCalls.push(path);
    return folder;
  }

  async create(path: string, data: string): Promise<TFile> {
    const file = this.makeFile(path);
    this.files.set(path, { file, content: data });
    this.createCalls.push({ path, data });
    return file;
  }

  async cachedRead(file: TFile): Promise<string> {
    const record = this.files.get(file.path);
    if (!record) {
      throw new Error(`Missing file: ${file.path}`);
    }

    return record.content;
  }

  async modify(file: TFile, data: string): Promise<void> {
    const record = this.files.get(file.path);
    if (!record) {
      throw new Error(`Missing file: ${file.path}`);
    }

    record.content = data;
    this.modifyCalls.push({ path: file.path, data });
  }

  seedFile(path: string, data: string): TFile {
    const file = this.makeFile(path);
    this.files.set(path, { file, content: data });
    return file;
  }

  readSeededContent(path: string): string | undefined {
    return this.files.get(path)?.content;
  }

  private makeFolder(path: string): TFolder {
    const name = path.split("/").pop() ?? "";
    return {
      path,
      name,
      parent: null,
      children: [],
      isRoot: () => path === "",
    } as unknown as TFolder;
  }

  private makeFile(path: string): TFile {
    const name = path.split("/").pop() ?? path;
    const basename = name.replace(/\.md$/u, "");
    return {
      path,
      name,
      basename,
      extension: "md",
      parent: null,
      stat: {
        ctime: 0,
        mtime: 0,
        size: 0,
      },
    } as unknown as TFile;
  }
}

function createApp(vault: FakeVault): App {
  return {
    vault,
  } as unknown as App;
}

function buildLog(): WeeklyLog {
  return parseWeeklyLog(
    buildWeeklyLogTemplate({
      weekId: "2026-W15",
      startDate: "2026-04-06",
      endDate: "2026-04-12",
      slotNames: [...DEFAULT_SLOT_NAMES],
    }),
  );
}

describe("WeeklyLogService", () => {
  it("resolves the current week file path in the default folder", () => {
    const vault = new FakeVault();
    const service = new WeeklyLogService(createApp(vault), {
      now: () => new Date("2026-04-08T12:00:00Z"),
    });

    expect(service.getCurrentWeekPath()).toBe("Weekly/2026-W15.md");
  });

  it("creates the current week file from the template when missing", async () => {
    const vault = new FakeVault();
    const service = new WeeklyLogService(createApp(vault), {
      now: () => new Date("2026-04-08T12:00:00Z"),
    });

    const file = await service.ensureCurrentWeekFile();

    expect(file.path).toBe("Weekly/2026-W15.md");
    expect(vault.createFolderCalls).toEqual(["Weekly"]);
    expect(vault.createCalls).toHaveLength(1);
    expect(vault.createCalls[0]?.path).toBe("Weekly/2026-W15.md");
    expect(vault.createCalls[0]?.data).toBe(
      buildWeeklyLogTemplate({
        weekId: "2026-W15",
        startDate: "2026-04-06",
        endDate: "2026-04-12",
        slotNames: [...DEFAULT_SLOT_NAMES],
      }),
    );
  });

  it("returns an existing current week file without recreating it", async () => {
    const vault = new FakeVault();
    const existing = vault.seedFile(
      "Weekly/2026-W15.md",
      buildWeeklyLogTemplate({
        weekId: "2026-W15",
        startDate: "2026-04-06",
        endDate: "2026-04-12",
        slotNames: [...DEFAULT_SLOT_NAMES],
      }),
    );
    const service = new WeeklyLogService(createApp(vault), {
      now: () => new Date("2026-04-08T12:00:00Z"),
    });

    const file = await service.ensureCurrentWeekFile();

    expect(file).toBe(existing);
    expect(vault.createFolderCalls).toEqual(["Weekly"]);
    expect(vault.createCalls).toEqual([]);
  });

  it("reads a weekly log by parsing the vault markdown", async () => {
    const vault = new FakeVault();
    const file = vault.seedFile(
      "Weekly/2026-W15.md",
      buildWeeklyLogTemplate({
        weekId: "2026-W15",
        startDate: "2026-04-06",
        endDate: "2026-04-12",
        slotNames: ["晨间", "专注"],
      }),
    );
    const service = new WeeklyLogService(createApp(vault));

    const log = await service.readLog(file);

    expect(log.weekId).toBe("2026-W15");
    expect(log.slotNames).toEqual(["晨间", "专注"]);
  });

  it("saves a weekly log by serializing it back to the vault", async () => {
    const vault = new FakeVault();
    const file = vault.seedFile(
      "Weekly/2026-W15.md",
      buildWeeklyLogTemplate({
        weekId: "2026-W15",
        startDate: "2026-04-06",
        endDate: "2026-04-12",
        slotNames: [...DEFAULT_SLOT_NAMES],
      }),
    );
    const service = new WeeklyLogService(createApp(vault));
    const log = buildLog();
    log.days[0]?.slotLogs[0]?.entries.push({
      time: "08:30",
      tag: "开发",
      text: "实现周记录服务",
    });

    await service.saveLog(file, log);

    expect(vault.modifyCalls).toHaveLength(1);
    expect(vault.modifyCalls[0]?.path).toBe("Weekly/2026-W15.md");
    expect(vault.readSeededContent("Weekly/2026-W15.md")).toContain(
      "- 08:30 [开发] 实现周记录服务",
    );
  });
});
