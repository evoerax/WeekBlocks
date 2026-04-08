import {
  Plugin,
  TAbstractFile,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import { VIEW_TYPE_WEEKLY_LOG } from "./constants";
import { WeeklyLogService } from "./service/weekly-log-service";
import { WeeklyLogView } from "./view/weekly-log-view";

export default class WeekBlocksPlugin extends Plugin {
  private service!: WeeklyLogService;

  async onload(): Promise<void> {
    this.service = new WeeklyLogService(this.app);

    this.registerView(
      VIEW_TYPE_WEEKLY_LOG,
      (leaf) => new WeeklyLogView(leaf, this.service),
    );

    this.addCommand({
      id: "open-weekly-log",
      name: "Open Weekly Log",
      callback: () => {
        void this.activateWeeklyLogView();
      },
    });

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        void this.handleFileModify(file);
      }),
    );
  }

  onunload(): void {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_LOG).forEach((leaf) => {
      leaf.detach();
    });
  }

  private async activateWeeklyLogView(): Promise<void> {
    const leaf = await this.getOrCreateViewLeaf();
    await leaf.setViewState({
      type: VIEW_TYPE_WEEKLY_LOG,
      active: true,
    });

    this.app.workspace.revealLeaf(leaf);

    const view = leaf.view;
    if (view instanceof WeeklyLogView) {
      await view.loadCurrentWeek();
    }
  }

  private async handleFileModify(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile)) {
      return;
    }

    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_LOG);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof WeeklyLogView)) {
        continue;
      }

      if (view.getCurrentFilePath() === file.path) {
        await view.reloadFromFile(file);
      }
    }
  }

  private async getOrCreateViewLeaf(): Promise<WorkspaceLeaf> {
    const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_WEEKLY_LOG)[0];
    if (existingLeaf) {
      return existingLeaf;
    }

    return this.app.workspace.getLeaf(true);
  }
}
