import {
  CUSTOM_BLOCKS_HEADING,
  WEEKDAY_KEYS,
  WEEKDAY_TITLES,
} from "../constants";
import type { CustomTimeBlock, LogEntry, SlotLog, WeeklyLog } from "../types";

export function serializeWeeklyLog(log: WeeklyLog): string {
  const frontmatter = [
    "---",
    "type: weekly-log",
    `week: ${log.weekId}`,
    `start: ${log.startDate}`,
    `end: ${log.endDate}`,
    "slots:",
    ...log.slotNames.map((slotName) => `  - ${slotName}`),
    "---",
  ].join("\n");

  const daysByKey = new Map(log.days.map((day) => [day.dayKey, day]));
  const daySections = WEEKDAY_KEYS.map((dayKey, index) => {
    const day = daysByKey.get(dayKey);
    const slotLogsByName = new Map<string, SlotLog>(
      (day?.slotLogs ?? []).map((slotLog) => [slotLog.slotName, slotLog]),
    );

    const slotSections = log.slotNames.map((slotName) =>
      buildSection(
        `### ${slotName}`,
        formatFixedSlotEntries(slotLogsByName.get(slotName)?.entries ?? []),
      ),
    );

    return [
      `## ${WEEKDAY_TITLES[index]}`,
      ...slotSections,
      buildSection(
        `### ${CUSTOM_BLOCKS_HEADING}`,
        formatCustomBlockEntries(day?.customBlocks ?? []),
      ),
    ].join("\n\n");
  });

  return `${frontmatter}\n\n# ${log.weekId} 周记录\n\n${daySections.join("\n\n")}\n`;
}

function buildSection(heading: string, lines: string[]) {
  if (lines.length === 0) {
    return heading;
  }

  return `${heading}\n\n${lines.join("\n")}`;
}

function formatFixedSlotEntries(entries: LogEntry[]) {
  return entries.map((entry) => `- ${entry.time} [${entry.tag}] ${entry.text}`);
}

function formatCustomBlockEntries(entries: CustomTimeBlock[]) {
  return entries.map(
    (entry) =>
      `- ${entry.startTime}-${entry.endTime} [${entry.tag}] ${entry.text}`,
  );
}
