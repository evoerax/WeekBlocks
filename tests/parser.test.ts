import { describe, expect, it } from "vitest";
import { CUSTOM_BLOCKS_HEADING, DEFAULT_SLOT_NAMES } from "../src/constants";
import { parseWeeklyLog } from "../src/markdown/parser";
import { buildWeeklyLogTemplate } from "../src/markdown/template";

function buildWeeklyMarkdown(overrides?: {
  frontmatter?: string[];
  mondayBody?: string[];
  otherDayBody?: string[];
  dayTitles?: string[];
}) {
  const slotHeadings = DEFAULT_SLOT_NAMES.flatMap((slotName) => [`### ${slotName}`, ""]);
  const defaultDayBody = [...slotHeadings, `### ${CUSTOM_BLOCKS_HEADING}`];
  const dayTitles = overrides?.dayTitles ?? [
    "周一",
    "周二",
    "周三",
    "周四",
    "周五",
    "周六",
    "周日",
  ];
  const sections = dayTitles.map((title, index) => {
    const body =
      index === 0
        ? overrides?.mondayBody ?? defaultDayBody
        : overrides?.otherDayBody ?? defaultDayBody;

    return [`## ${title}`, ...body].join("\n");
  });

  return [
    "---",
    ...(overrides?.frontmatter ?? [
      "type: weekly-log",
      "week: 2026-W15",
      "start: 2026-04-06",
      "end: 2026-04-12",
      "slots:",
      ...DEFAULT_SLOT_NAMES.map((slotName) => `  - ${slotName}`),
    ]),
    "---",
    "",
    "# 2026-W15 周记录",
    "",
    ...sections,
    "",
  ].join("\n");
}

describe("parseWeeklyLog", () => {
  it("parses fixed-slot entries", () => {
    const markdown = buildWeeklyMarkdown({
      mondayBody: [
        "### 早上",
        "- 10:30 [开发] 写了插件设计文档",
        "",
        "### 中午",
        "",
        "### 下午",
        "",
        "### 晚上",
        "",
        `### ${CUSTOM_BLOCKS_HEADING}`,
      ],
    });

    const parsed = parseWeeklyLog(markdown);

    expect(parsed.weekId).toBe("2026-W15");
    expect(parsed.slotNames).toEqual([...DEFAULT_SLOT_NAMES]);
    expect(parsed.days[0]?.slotLogs[0]?.entries).toEqual([
      {
        time: "10:30",
        tag: "开发",
        text: "写了插件设计文档",
      },
    ]);
  });

  it("parses custom blocks", () => {
    const markdown = buildWeeklyMarkdown({
      mondayBody: [
        "### 早上",
        "",
        "### 中午",
        "",
        "### 下午",
        "",
        "### 晚上",
        "",
        `### ${CUSTOM_BLOCKS_HEADING}`,
        "- 09:30-11:00 [开发] 深度工作：插件结构设计",
      ],
    });

    const parsed = parseWeeklyLog(markdown);

    expect(parsed.days[0]?.customBlocks).toEqual([
      {
        startTime: "09:30",
        endTime: "11:00",
        tag: "开发",
        text: "深度工作：插件结构设计",
      },
    ]);
  });

  it("rejects malformed fixed-slot entries", () => {
    const markdown = buildWeeklyMarkdown({
      mondayBody: [
        "### 早上",
        "- 10:30 [开发]",
        "",
        "### 中午",
        "",
        "### 下午",
        "",
        "### 晚上",
        "",
        `### ${CUSTOM_BLOCKS_HEADING}`,
      ],
    });

    expect(() => parseWeeklyLog(markdown)).toThrow(/fixed-slot entry/i);
  });

  it("rejects malformed custom block entries", () => {
    const markdown = buildWeeklyMarkdown({
      mondayBody: [
        "### 早上",
        "",
        "### 中午",
        "",
        "### 下午",
        "",
        "### 晚上",
        "",
        `### ${CUSTOM_BLOCKS_HEADING}`,
        "- 09:30- [开发] 深度工作：插件结构设计",
      ],
    });

    expect(() => parseWeeklyLog(markdown)).toThrow(/custom block/i);
  });

  it("rejects missing day sections", () => {
    const markdown = buildWeeklyMarkdown({
      dayTitles: ["周一", "周二", "周三", "周四", "周五", "周六"],
    });

    expect(() => parseWeeklyLog(markdown)).toThrow(/seven day sections/i);
  });

  it("rejects missing slots frontmatter", () => {
    const markdown = buildWeeklyMarkdown({
      frontmatter: [
        "type: weekly-log",
        "week: 2026-W15",
        "start: 2026-04-06",
        "end: 2026-04-12",
      ],
    });

    expect(() => parseWeeklyLog(markdown)).toThrow(/slots/i);
  });

  it("rejects empty slots frontmatter", () => {
    const markdown = buildWeeklyMarkdown({
      frontmatter: [
        "type: weekly-log",
        "week: 2026-W15",
        "start: 2026-04-06",
        "end: 2026-04-12",
        "slots:",
      ],
    });

    expect(() => parseWeeklyLog(markdown)).toThrow(/slots/i);
  });

  it("allows extra frontmatter keys", () => {
    const markdown = buildWeeklyMarkdown({
      frontmatter: [
        "type: weekly-log",
        "week: 2026-W15",
        "start: 2026-04-06",
        "end: 2026-04-12",
        "tags:",
        "  - weekly",
        "aliases:",
        "  - 本周记录",
        "summary: keep this",
        "slots:",
        ...DEFAULT_SLOT_NAMES.map((slotName) => `  - ${slotName}`),
      ],
    });

    const parsed = parseWeeklyLog(markdown);

    expect(parsed.weekId).toBe("2026-W15");
    expect(parsed.slotNames).toEqual([...DEFAULT_SLOT_NAMES]);
  });

  it("parses the current weekly template output", () => {
    const markdown = buildWeeklyLogTemplate({
      weekId: "2026-W15",
      startDate: "2026-04-06",
      endDate: "2026-04-12",
      slotNames: ["晨间", "专注", "收尾"],
    });

    const parsed = parseWeeklyLog(markdown);

    expect(parsed).toEqual({
      weekId: "2026-W15",
      startDate: "2026-04-06",
      endDate: "2026-04-12",
      slotNames: ["晨间", "专注", "收尾"],
      days: [
        {
          dayKey: "monday",
          title: "周一",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
        {
          dayKey: "tuesday",
          title: "周二",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
        {
          dayKey: "wednesday",
          title: "周三",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
        {
          dayKey: "thursday",
          title: "周四",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
        {
          dayKey: "friday",
          title: "周五",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
        {
          dayKey: "saturday",
          title: "周六",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
        {
          dayKey: "sunday",
          title: "周日",
          slotLogs: [
            { slotName: "晨间", entries: [] },
            { slotName: "专注", entries: [] },
            { slotName: "收尾", entries: [] },
          ],
          customBlocks: [],
        },
      ],
    });
  });
});
