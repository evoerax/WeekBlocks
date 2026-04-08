import {
  CUSTOM_BLOCKS_HEADING,
  WEEKDAY_KEYS,
  WEEKDAY_TITLES,
} from "../constants";
import type {
  CustomTimeBlock,
  DayLog,
  LogEntry,
  SlotLog,
  WeeklyLog,
} from "../types";

const FIXED_SLOT_ENTRY_PATTERN =
  /^- (?<time>(?:[01]\d|2[0-3]):[0-5]\d) \[(?<tag>[^\]]+)\] (?<text>.+)$/u;
const CUSTOM_BLOCK_ENTRY_PATTERN =
  /^- (?<start>(?:[01]\d|2[0-3]):[0-5]\d)-(?<end>(?:[01]\d|2[0-3]):[0-5]\d) \[(?<tag>[^\]]+)\] (?<text>.+)$/u;

export function parseWeeklyLog(markdown: string): WeeklyLog {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const { frontmatter, nextIndex } = parseFrontmatter(lines);
  const weekId = requireFrontmatterValue(frontmatter.week, "week");
  const startDate = requireFrontmatterValue(frontmatter.start, "start");
  const endDate = requireFrontmatterValue(frontmatter.end, "end");

  if (frontmatter.type !== "weekly-log") {
    throw new Error("Invalid frontmatter: expected type: weekly-log.");
  }

  if (!frontmatter.hasSlotsField) {
    throw new Error("Invalid frontmatter: missing required slots field.");
  }

  if (frontmatter.slots.length === 0) {
    throw new Error(
      "Invalid frontmatter: slots must contain at least one slot name.",
    );
  }

  let index = skipBlankLines(lines, nextIndex);
  const expectedTitle = `# ${weekId} 周记录`;
  if (lines[index] !== expectedTitle) {
    throw new Error(`Invalid title: expected "${expectedTitle}".`);
  }
  index += 1;

  const days: DayLog[] = [];
  for (let dayIndex = 0; dayIndex < WEEKDAY_TITLES.length; dayIndex += 1) {
    index = skipBlankLines(lines, index);
    const expectedDayHeading = `## ${WEEKDAY_TITLES[dayIndex]}`;

    if (lines[index] !== expectedDayHeading) {
      throw new Error(
        "Invalid weekly log schema: expected seven day sections in Monday-to-Sunday order using shared weekday titles.",
      );
    }

    index += 1;
    const slotLogs: SlotLog[] = [];
    for (const slotName of frontmatter.slots) {
      index = skipBlankLines(lines, index);
      const expectedSlotHeading = `### ${slotName}`;
      if (lines[index] !== expectedSlotHeading) {
        throw new Error(
          `Invalid day schema for ${WEEKDAY_TITLES[dayIndex]}: expected slot heading "${expectedSlotHeading}".`,
        );
      }

      index += 1;
      const parsedSlot = parseFixedSlotEntries(
        lines,
        index,
        `## ${WEEKDAY_TITLES[dayIndex]}`,
        slotName,
      );
      slotLogs.push({
        slotName,
        entries: parsedSlot.entries,
      });
      index = parsedSlot.nextIndex;
    }

    index = skipBlankLines(lines, index);
    if (lines[index] !== `### ${CUSTOM_BLOCKS_HEADING}`) {
      throw new Error(
        `Invalid day schema for ${WEEKDAY_TITLES[dayIndex]}: expected custom block heading "### ${CUSTOM_BLOCKS_HEADING}".`,
      );
    }

    index += 1;
    const parsedCustomBlocks = parseCustomBlockEntries(
      lines,
      index,
      `## ${WEEKDAY_TITLES[dayIndex]}`,
    );
    days.push({
      dayKey: WEEKDAY_KEYS[dayIndex],
      title: WEEKDAY_TITLES[dayIndex],
      slotLogs,
      customBlocks: parsedCustomBlocks.entries,
    });
    index = parsedCustomBlocks.nextIndex;
  }

  index = skipBlankLines(lines, index);
  if (index < lines.length) {
    throw new Error(`Unexpected content after final day section at line ${index + 1}.`);
  }

  return {
    weekId,
    startDate,
    endDate,
    slotNames: [...frontmatter.slots],
    days,
  };
}

function parseFrontmatter(lines: string[]) {
  if (lines[0] !== "---") {
    throw new Error("Missing frontmatter opening delimiter.");
  }

  const fields: {
    type?: string;
    week?: string;
    start?: string;
    end?: string;
    slots: string[];
    hasSlotsField: boolean;
  } = {
    slots: [],
    hasSlotsField: false,
  };

  let index = 1;
  while (index < lines.length) {
    const line = lines[index];
    if (line === "---") {
      return {
        frontmatter: fields,
        nextIndex: index + 1,
      };
    }

    if (line === "slots:") {
      fields.hasSlotsField = true;
      index += 1;
      while (index < lines.length && lines[index].startsWith("  - ")) {
        const slotName = lines[index].slice(4).trim();
        if (!slotName) {
          throw new Error(`Invalid frontmatter: empty slot name at line ${index + 1}.`);
        }
        fields.slots.push(slotName);
        index += 1;
      }
      continue;
    }

    const match = /^(type|week|start|end):\s*(.+)$/u.exec(line);
    if (!match?.[1] || !match[2]) {
      throw new Error(`Invalid frontmatter line ${index + 1}: "${line}".`);
    }

    const key = match[1] as "type" | "week" | "start" | "end";
    fields[key] = match[2].trim();
    index += 1;
  }

  throw new Error("Missing frontmatter closing delimiter.");
}

function requireFrontmatterValue(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`Missing frontmatter field: ${key}.`);
  }

  return value;
}

function parseFixedSlotEntries(
  lines: string[],
  startIndex: number,
  dayHeading: string,
  slotName: string,
): {
  entries: LogEntry[];
  nextIndex: number;
} {
  const entries: LogEntry[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line === "" || line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("### ") || line.startsWith("## ")) {
      break;
    }

    const match = FIXED_SLOT_ENTRY_PATTERN.exec(line);
    if (!match?.groups) {
      throw new Error(
        `Invalid fixed-slot entry in ${dayHeading} / ${slotName} at line ${index + 1}: "${line}".`,
      );
    }

    entries.push({
      time: match.groups.time,
      tag: match.groups.tag,
      text: match.groups.text,
    });
    index += 1;
  }

  return { entries, nextIndex: index };
}

function parseCustomBlockEntries(
  lines: string[],
  startIndex: number,
  dayHeading: string,
): {
  entries: CustomTimeBlock[];
  nextIndex: number;
} {
  const entries: CustomTimeBlock[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line === "" || line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      break;
    }

    if (line.startsWith("### ")) {
      throw new Error(
        `Invalid day schema for ${dayHeading.slice(3)}: unexpected heading "${line}" inside custom blocks.`,
      );
    }

    const match = CUSTOM_BLOCK_ENTRY_PATTERN.exec(line);
    if (!match?.groups) {
      throw new Error(
        `Invalid custom block entry in ${dayHeading} at line ${index + 1}: "${line}".`,
      );
    }

    entries.push({
      startTime: match.groups.start,
      endTime: match.groups.end,
      tag: match.groups.tag,
      text: match.groups.text,
    });
    index += 1;
  }

  return { entries, nextIndex: index };
}

function skipBlankLines(lines: string[], index: number) {
  let nextIndex = index;
  while (nextIndex < lines.length && lines[nextIndex].trim() === "") {
    nextIndex += 1;
  }

  return nextIndex;
}
