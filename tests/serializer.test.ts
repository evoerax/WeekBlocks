import { describe, expect, it } from "vitest";
import {
  CUSTOM_BLOCKS_HEADING,
  WEEKDAY_KEYS,
  WEEKDAY_TITLES,
} from "../src/constants";
import { getWeekInfoFromDate } from "../src/date/week";
import { serializeWeeklyLog } from "../src/markdown/serializer";
import { buildWeeklyLogTemplate } from "../src/markdown/template";
import type { DayLog, WeeklyLog } from "../src/types";

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

function buildDayLog(dayKey: DayLog["dayKey"], overrides?: Partial<DayLog>): DayLog {
  const dayIndex = WEEKDAY_KEYS.indexOf(dayKey);

  return {
    dayKey,
    title: WEEKDAY_TITLES[dayIndex],
    slotLogs: [],
    customBlocks: [],
    ...overrides,
  };
}

describe("serializeWeeklyLog", () => {
  it("serializes a weekly log into deterministic markdown", () => {
    const log: WeeklyLog = {
      weekId: "2026-W15",
      startDate: "2026-04-06",
      endDate: "2026-04-12",
      slotNames: ["晨间", "专注", "收尾"],
      days: [
        buildDayLog("wednesday", {
          slotLogs: [
            {
              slotName: "收尾",
              entries: [{ time: "19:00", tag: "总结", text: "整理今日复盘" }],
            },
            {
              slotName: "晨间",
              entries: [{ time: "08:10", tag: "计划", text: "安排本日优先级" }],
            },
          ],
          customBlocks: [
            {
              startTime: "14:00",
              endTime: "15:30",
              tag: "会议",
              text: "需求评审",
            },
          ],
        }),
        buildDayLog("monday", {
          slotLogs: [
            {
              slotName: "收尾",
              entries: [{ time: "18:40", tag: "总结", text: "更新周报草稿" }],
            },
            {
              slotName: "晨间",
              entries: [{ time: "08:30", tag: "开发", text: "实现解析器" }],
            },
            {
              slotName: "专注",
              entries: [{ time: "13:15", tag: "开发", text: "补齐测试用例" }],
            },
          ],
          customBlocks: [
            {
              startTime: "09:30",
              endTime: "11:00",
              tag: "沟通",
              text: "需求同步",
            },
          ],
        }),
        buildDayLog("sunday"),
        buildDayLog("friday"),
        buildDayLog("tuesday"),
        buildDayLog("saturday"),
        buildDayLog("thursday"),
      ],
    };

    expect(serializeWeeklyLog(log)).toBe(`---
type: weekly-log
week: 2026-W15
start: 2026-04-06
end: 2026-04-12
slots:
  - 晨间
  - 专注
  - 收尾
---

# 2026-W15 周记录

## 周一

### 晨间

- 08:30 [开发] 实现解析器

### 专注

- 13:15 [开发] 补齐测试用例

### 收尾

- 18:40 [总结] 更新周报草稿

### ${CUSTOM_BLOCKS_HEADING}

- 09:30-11:00 [沟通] 需求同步

## 周二

### 晨间

### 专注

### 收尾

### ${CUSTOM_BLOCKS_HEADING}

## 周三

### 晨间

- 08:10 [计划] 安排本日优先级

### 专注

### 收尾

- 19:00 [总结] 整理今日复盘

### ${CUSTOM_BLOCKS_HEADING}

- 14:00-15:30 [会议] 需求评审

## 周四

### 晨间

### 专注

### 收尾

### ${CUSTOM_BLOCKS_HEADING}

## 周五

### 晨间

### 专注

### 收尾

### ${CUSTOM_BLOCKS_HEADING}

## 周六

### 晨间

### 专注

### 收尾

### ${CUSTOM_BLOCKS_HEADING}

## 周日

### 晨间

### 专注

### 收尾

### ${CUSTOM_BLOCKS_HEADING}
`);
  });

  it("includes frontmatter and ordered day sections", () => {
    const log: WeeklyLog = {
      weekId: "2026-W16",
      startDate: "2026-04-13",
      endDate: "2026-04-19",
      slotNames: ["早上", "下午"],
      days: [
        buildDayLog("sunday"),
        buildDayLog("thursday"),
        buildDayLog("monday"),
        buildDayLog("friday"),
        buildDayLog("tuesday"),
        buildDayLog("wednesday"),
        buildDayLog("saturday"),
      ],
    };

    const markdown = serializeWeeklyLog(log);

    expect(markdown).toContain(`---
type: weekly-log
week: 2026-W16
start: 2026-04-13
end: 2026-04-19
slots:
  - 早上
  - 下午
---`);
    expect(markdown.indexOf("## 周一")).toBeLessThan(markdown.indexOf("## 周二"));
    expect(markdown.indexOf("## 周二")).toBeLessThan(markdown.indexOf("## 周三"));
    expect(markdown.indexOf("## 周三")).toBeLessThan(markdown.indexOf("## 周四"));
    expect(markdown.indexOf("## 周四")).toBeLessThan(markdown.indexOf("## 周五"));
    expect(markdown.indexOf("## 周五")).toBeLessThan(markdown.indexOf("## 周六"));
    expect(markdown.indexOf("## 周六")).toBeLessThan(markdown.indexOf("## 周日"));
  });
});
