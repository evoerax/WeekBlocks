import { describe, expect, it } from "vitest";
import { getWeekInfoFromDate } from "../src/date/week";
import { buildWeeklyLogTemplate } from "../src/markdown/template";

describe("getWeekInfoFromDate", () => {
  it("returns week id and monday-sunday bounds", () => {
    const result = getWeekInfoFromDate(new Date("2026-04-08T12:00:00Z"));
    expect(result.weekId).toBe("2026-W15");
    expect(result.startDate).toBe("2026-04-06");
    expect(result.endDate).toBe("2026-04-12");
  });
});

describe("buildWeeklyLogTemplate", () => {
  it("generates the weekly log markdown template", () => {
    const markdown = buildWeeklyLogTemplate({
      weekId: "2026-W15",
      startDate: "2026-04-06",
      endDate: "2026-04-12",
      slotNames: ["早上", "中午", "下午", "晚上"],
    });

    expect(markdown).toContain("type: weekly-log");
    expect(markdown).toContain("# 2026-W15 周记录");
    expect(markdown).toContain("## 周一");
    expect(markdown).toContain("### 早上");
    expect(markdown).toContain("### 自定义时间块");
  });
});
