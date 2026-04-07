import { CUSTOM_BLOCKS_HEADING, WEEKDAY_TITLES } from "../constants";

export function buildWeeklyLogTemplate(input: {
  weekId: string;
  startDate: string;
  endDate: string;
  slotNames: string[];
}): string {
  const frontmatter = [
    "---",
    "type: weekly-log",
    `week: ${input.weekId}`,
    `start: ${input.startDate}`,
    `end: ${input.endDate}`,
    "slots:",
    ...input.slotNames.map((slotName) => `  - ${slotName}`),
    "---",
  ].join("\n");

  const daySections = WEEKDAY_TITLES.map((dayTitle) => {
    const slotSections = input.slotNames.map((slotName) => `### ${slotName}`);

    return [`## ${dayTitle}`, ...slotSections, `### ${CUSTOM_BLOCKS_HEADING}`].join(
      "\n\n",
    );
  });

  return `${frontmatter}\n\n# ${input.weekId} 周记录\n\n${daySections.join(
    "\n\n",
  )}\n`;
}
